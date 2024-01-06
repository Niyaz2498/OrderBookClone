import React, { useEffect, useRef, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import OrderBookRow from "./OrderBookRow";

function TableConstructor(dict, reverse = false) {
  // TODO: Dont Construct Table on each update. Instead update Rows Alone.
  // Expected Benifit: Makes styling rows on updates easier.
  let header = (
    <tr>
      <th>Count</th>
      <th>Amount</th>
      <th>Price</th>
    </tr>
  );
  let row = undefined;

  if (reverse) {
    header = (
      <tr>
        <th>Price</th>
        <th>Amount</th>
        <th>Count</th>
      </tr>
    );
    row = Object.entries(dict).map(([k, v]) => (
      <OrderBookRow id={v.join("-")} value={[v[0], v[2], v[1]]} />
    ));
  } else {
    row = Object.entries(dict).map(([k, v]) => (
      <OrderBookRow id={v.join("-")} value={[v[1], v[2], v[0]]} />
    ));
  }

  return (
    <table id="TableStyle">
      {header}
      {row}
    </table>
  );
}

const OrderBook = () => {
  const [bids, setBids] = useState(
    localStorage.getItem("bids") ? JSON.parse(localStorage.getItem("bids")) : {}
  );
  const [asks, setAsks] = useState(
    localStorage.getItem("asks") ? JSON.parse(localStorage.getItem("asks")) : {}
  );
  const [askTable, setAskTable] = useState(TableConstructor(asks));
  const [bidTable, setBidTable] = useState(TableConstructor(bids, true));

  const { lastMessage, readyState, sendMessage } = useWebSocket(
    "wss://api-pub.bitfinex.com/ws/2"
  );

  const handleLogUpdate = (element) => {
    if (element[1] > 0) {
      if (element[2] > 0) {
        let key = element[0];
        let updatedBids = {
          ...bids,
        };
        updatedBids[key] = [element[0], element[1], element[2].toFixed(4)];
        setBids(updatedBids);
      } else {
        let key = element[0];
        let updatedAsks = {
          ...asks,
        };
        element[2] = Math.abs(element[2]);
        updatedAsks[key] = [element[0], element[1], element[2].toFixed(4)];
        setAsks(updatedAsks);
      }
    } else if (element[1] == 0) {
      if (element[2] == 1) {
        const UpdatedBids = { ...bids };
        delete UpdatedBids[element[0]];
        setBids(UpdatedBids);
      } else {
        const UpdatedAsks = { ...asks };
        delete UpdatedAsks[element[0]];
        setAsks(UpdatedAsks);
      }
    }
  };

  let msg = JSON.stringify({
    event: "subscribe",
    channel: "book",
    symbol: "tBTCUSD",
  });
  React.useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      sendMessage(msg);
    }
  }, [readyState, sendMessage]);

  React.useEffect(() => {
    if (lastMessage !== null) {
      const data = JSON.parse(lastMessage.data);
      if (data["event"]) {
        return;
      } else {
        if (Array.isArray(data[1][0])) {
          data[1].forEach((element) => {
            handleLogUpdate(element);
          });
        } else {
          handleLogUpdate(data[1]);
        }
      }
      setAskTable(TableConstructor(asks));
      setBidTable(TableConstructor(bids, true));
      localStorage.setItem("asks", JSON.stringify(asks));
      localStorage.setItem("bids", JSON.stringify(bids));
    }
  }, [lastMessage]);

  return (
    <div id="BookHolder">
      <div id="AskTableHolder">
        <div>asks:</div>
        {askTable}
      </div>
      <div id="BidTableHolder">
        <div>bids:</div>
        {bidTable}
      </div>
    </div>
  );
};

export default OrderBook;
