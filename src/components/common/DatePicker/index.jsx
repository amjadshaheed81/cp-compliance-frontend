import React, { useEffect, useRef, useState } from "react";
import "./datepicker.css";
import { connect } from "react-redux";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";

const TdkDatePicker = ({
  value,
  onChange,
  required,
  label,
  width = "380px",
  disabled,
}) => {
  const datePickerRef = useRef(null);
  const [manualInput, setManualInput] = useState(
    value ? moment(value).format("DD/MM/YYYY") : ""
  );
  const [isTyping, setIsTyping] = useState(false); // Track if user is typing
  // Format input with slashes automatically
  const formatDateWithSlashes = (input) => {
    const digits = input.replace(/\D/g, ""); // Remove non-numeric characters
    const day = digits?.slice(0, 2);
    const month = digits?.slice(2, 4);
    const year = digits?.slice(4, 8);

    let formattedDate = day;
    if (month) formattedDate += `/${month}`;
    if (year) formattedDate += `/${year}`;

    return formattedDate;
  };
  // Handle manual date input
  const handleInputChange = (e) => {
    let inputValue = e.target.value;
    inputValue = formatDateWithSlashes(inputValue);

    setManualInput(inputValue);
    setIsTyping(true); // Set typing to true when user types manually

    // Validate and parse the input as a valid date
    const parsedDate = moment(inputValue, "DD/MM/YYYY", true); // strict parsing
    if (parsedDate.isValid()) {
      onChange(parsedDate.toDate());
    }
  };

  // Open date picker only when not typing and the input is clicked
  const handleInputClick = () => {
    if (!isTyping) {
      datePickerRef.current.setOpen(true); // Open only if user is not typing
    }
  };

  return (
    <div>
      {label && <label htmlFor="datePicker">{label}</label>}
      <div style={{ display: "flex", alignItems: "center" }}>
        <input
          required={required}
          type="text"
autoComplete="off"
          id="datePicker"
          value={manualInput}
          placeholder="dd/mm/yyyy"
          className="form-control"
          disabled={disabled ? true : false}
          style={{
            width: width,
          }}
          onChange={handleInputChange} // Handle manual input
          onClick={handleInputClick} // Open date picker on click (if not typing)
          onBlur={() => setIsTyping(false)} // Reset typing state when input loses focus
        />
        <CalendarTodayIcon
          style={{
            cursor: "pointer",
            color: "#aaa",
          }}
          onClick={() => datePickerRef.current.setOpen(true)} // Open date picker on icon click
        />
      </div>
      <DatePicker
        ref={datePickerRef}
        selected={value ? new Date(value) : null}
        onChange={(date) => {
          onChange(date);
          setManualInput(moment(date).format("DD/MM/YYYY")); // Update the input when date is selected
        }}
        dateFormat="dd/MM/yyyy"
        customInput={<div />} // Avoid rendering a second input field
        popperClassName="custom-datepicker-popper"
        popperPlacement="bottom-end"
      />
    </div>
  );
};

const mapStateToProps = (state) => ({});
export default connect(mapStateToProps, {})(TdkDatePicker);
