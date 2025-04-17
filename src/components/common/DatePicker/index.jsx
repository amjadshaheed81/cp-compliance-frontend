import React, { useEffect, useRef, useState } from "react";
import "./datepicker.css";
import { connect } from "react-redux";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import BackspaceIcon from "@mui/icons-material/Backspace";
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
  minDate,
  clearable = true, // Add this prop
}) => {
  const datePickerRef = useRef(null);
  const [manualInput, setManualInput] = useState(
    value ? moment(value).format("DD/MM/YYYY") : ""
  );
  const [isTyping, setIsTyping] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Format input with slashes automatically
  const formatDateWithSlashes = (input) => {
    const digits = input.replace(/\D/g, "");
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

    // If input is empty, clear the date
    if (inputValue === "") {
      handleClear();
      return;
    }

    inputValue = formatDateWithSlashes(inputValue);
    setManualInput(inputValue);
    setIsTyping(true);

    const parsedDate = moment(inputValue, "DD/MM/YYYY", true);
    if (parsedDate.isValid()) {
      onChange(parsedDate.toDate());
    }
  };

  // Clear the date
  const handleClear = () => {
    onChange(null);
    setManualInput("");
    setIsTyping(false);
    if (datePickerRef.current) {
      datePickerRef.current.setOpen(false);
    }
  };

  // Open date picker only when not typing and the input is clicked
  const handleInputClick = () => {
    if (!isTyping && !disabled) {
      datePickerRef.current.setOpen(true);
    }
  };

  // Sync manualInput when value prop changes
  useEffect(() => {
    if (!isTyping) {
      setManualInput(value ? moment(value).format("DD/MM/YYYY") : "");
    }
  }, [value, isTyping]);

  return (
    <div>
      {label && <label htmlFor="datePicker">{label}</label>}
      <div
        style={{ display: "flex", alignItems: "center", position: "relative" }}
      >
        <input
          required={required}
          type="text"
          autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
          id="datePicker"
          value={manualInput}
          placeholder="dd/mm/yyyy"
          className="form-control"
          disabled={disabled}
          style={{
            width: width,
            paddingRight: clearable ? "60px" : "40px", // Make space for icons
          }}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onBlur={() => setIsTyping(false)}
        />
        <div
          style={{
            position: "absolute",
            right: "10px",
            display: "flex",
            gap: "5px",
          }}
        >
          {clearable && manualInput && (
            <BackspaceIcon
              style={{
                cursor: "pointer",
                color: isHovered ? "#d42e38" : "#aaa",
                fontSize: "18px",
                transition: "color 0.3s ease",
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={handleClear}
            />
          )}
          <CalendarTodayIcon
            style={{
              cursor: disabled ? "default" : "pointer",
              color: "#aaa",
              fontSize: "18px",
            }}
            onClick={() => !disabled && datePickerRef.current.setOpen(true)}
          />
        </div>
      </div>
      <DatePicker
        ref={datePickerRef}
        selected={value ? new Date(value) : null}
        onChange={(date) => {
          onChange(date);
          setManualInput(date ? moment(date).format("DD/MM/YYYY") : "");
        }}
        dateFormat="dd/MM/yyyy"
        customInput={<div />}
        popperClassName="custom-datepicker-popper"
        popperPlacement="bottom-end"
        minDate={minDate ? new Date(minDate) : null}
      />
    </div>
  );
};

const mapStateToProps = (state) => ({});
export default connect(mapStateToProps, {})(TdkDatePicker);
