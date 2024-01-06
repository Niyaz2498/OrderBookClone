import React from "react";

const OrderBookRow = (props) => {
  return (
    <tr id={props.value.join("-")}>
      <td>{props.value[0]}</td>
      <td>{props.value[1]}</td>
      <td>{props.value[2]}</td>
    </tr>
  );
};

export default OrderBookRow;
