import React from "react";
import { categoryEnum } from "../Constants/CategoryEnum";

const OrderBookRow = (props) => {
  return (
    <div className="rowHolder">
      {/* row values */}
      <div
        className={props.category == categoryEnum.ASKS ? "askRow" : "bidRow"}
      >
        <div>{props.value[0]}</div>
        <div>{props.value[1].toFixed(4)}</div>
        <div>{props.value[2].toFixed(4)}</div>
        <div>{props.value[3]}</div>
      </div>
      <div
        className={props.category == categoryEnum.ASKS ? "askBar" : "bidBar"}
        style={{ width: 320 * props.depth + "px" }}
      ></div>
    </div>
  );
};

export default OrderBookRow;
