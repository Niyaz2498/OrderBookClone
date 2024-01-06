import React, { useRef, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import OrderBookRow from "./OrderBookRow";
import { categoryEnum } from "../Constants/CategoryEnum";

const OrderBook = () => {
  const bids = useRef(
    localStorage.getItem("bids") ? JSON.parse(localStorage.getItem("bids")) : {}
  );
  const asks = useRef(
    localStorage.getItem("asks") ? JSON.parse(localStorage.getItem("asks")) : {}
  );
  const [askTable, setAskTable] = useState(TableConstructor("asks"));
  const [bidTable, setBidTable] = useState(TableConstructor("bids"));

  function TableConstructor(category = "asks") {
    // This function constructs the table  from asks and bids

    let sortedKeys =
      category == categoryEnum.ASKS
        ? Object.keys(asks.current).sort()
        : Object.keys(bids.current).sort();
    let prevAsks = 0;
    let prevBids = 0;
    let askRows = [];
    let bidRows = [];
    sortedKeys.forEach((element) => {
      if (category == categoryEnum.ASKS) {
        let currElem = asks.current[element];
        prevAsks += parseFloat(currElem[2].toFixed(4));
        currElem[3] = prevAsks;
        askRows.push(currElem);
      } else {
        let currElem = bids.current[element];
        let temp = prevBids;
        prevBids += parseFloat(currElem[2].toFixed(4));

        currElem[3] = prevBids;
        bidRows.push(currElem);
      }
    });
    let tableRow = [];
    if (category == categoryEnum.ASKS) {
      askRows.forEach((individualAskRow) => {
        let depth = individualAskRow[3] / prevAsks;
        tableRow.push(
          <OrderBookRow
            value={[individualAskRow[1], individualAskRow[2], individualAskRow[3], individualAskRow[0]]}
            depth={depth}
            category="asks"
          />
        );
      });
    } else {
      bidRows.forEach((individualBidRow) => {
        let depth = individualBidRow[3] / prevBids;
        tableRow.push(
          <OrderBookRow
            value={[individualBidRow[0], individualBidRow[3], individualBidRow[2], individualBidRow[1]]}
            depth={depth}
            category="bids"
          />
        );
      });
    }
    return tableRow;
  }

  const { lastMessage, readyState, sendMessage } = useWebSocket(
    "wss://api-pub.bitfinex.com/ws/2"
  );

  const handleValueUpdate = (element) => {
    // This function is invoked when we need to handle value on new message from web socket

    if (element[1] > 0) {
      // count > 0 - add to ask / bid
      if (element[2] > 0) {
        // amount > 0 - update asks
        let key = element[0];
        element[2] = Math.abs(element[2]);
        element[2] = parseFloat(element[2].toFixed(4));
        bids.current[key] = element;
      } else {
        // upddate bids
        let key = element[0];
        element[2] = Math.abs(element[2]);
        element[2] = parseFloat(element[2].toFixed(4));

        asks.current[key] = element;
        setAskTable(TableConstructor(categoryEnum.ASKS));
        setBidTable(TableConstructor(categoryEnum.BIDS));
      }
    } else if (element[1] == 0) {
      // count = 0 => delete ask/bids
      if (element[2] == 1) {
        // amount = 1  => delete bids
        delete bids.current[element[0]];
      } else {
        //  delete asks
        delete asks.current[element[0]];
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
    // gets invoked on message from websocket

    if (lastMessage !== null) {
      const data = JSON.parse(lastMessage.data);
      if (data["event"]) {
        return;
      } else {
        if (Array.isArray(data[1][0])) {
          data[1].forEach((element) => {
            handleValueUpdate(element);
          });
        } else {
          handleValueUpdate(data[1]);
        }
      }
      localStorage.setItem("asks", JSON.stringify(asks.current));
      localStorage.setItem("bids", JSON.stringify(bids.current));
    }
  }, [lastMessage]);

  return (
    <div id="BookHolder">
      <div id="AskTableHolder">
        <div>asks:</div>
        <div id="AskHeader">
          <div>Count</div>
          <div>Amount</div>
          <div>Total</div>
          <div>Price</div>
        </div>
        <div>{askTable}</div>
      </div>

      <div id="BidTableHolder">
        <div>bids:</div>
        <div id="BidHeader">
          <div>Price</div>
          <div>Total</div>
          <div>Amount</div>
          <div>Count</div>
        </div>
        <div>{bidTable}</div>
      </div>
    </div>
  );
};

export default OrderBook;
