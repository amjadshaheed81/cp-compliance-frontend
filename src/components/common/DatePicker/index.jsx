import React, { useEffect, useRef, useState } from "react";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";

const TdkDatePicker = ({
  value,
  onChange,
  required,
  label,
  width = "220px",
  disabled,
  minDate,
}) => {
  const datePickerRef = useRef(null);
  const inputRef = useRef(null);
  const [dateValue, setDateValue] = useState(value ? new Date(value) : null);
  const [displayValue, setDisplayValue] = useState(
    value ? moment(value).format("DD/MM/YYYY") : ""
  );
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (dateValue) {
      setDisplayValue(moment(dateValue).format("DD/MM/YYYY"));
    } else {
      setDisplayValue("");
    }
  }, [dateValue]);

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

  const getCursorPosFromDigitsCount = (formatted, digitsBefore) => {
    let digitsSeen = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) digitsSeen++;
      if (digitsSeen === digitsBefore) return i + 1;
    }
    return formatted.length;
  };

  const handleInputChange = (e) => {
    const el = inputRef.current || e.target;
    const raw = e.target.value;
    const selectionStart = el.selectionStart || 0;
    const digitsBefore = raw.slice(0, selectionStart).replace(/\D/g, "").length;

    const formatted = formatDateWithSlashes(raw);
    setDisplayValue(formatted);
    setIsTyping(true);

    // restore caret position based on digit count
    setTimeout(() => {
      if (inputRef.current) {
        const newPos = getCursorPosFromDigitsCount(formatted, digitsBefore);
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);

    const parsedDate = moment(formatted, "DD/MM/YYYY", true);
    if (parsedDate.isValid()) {
      const jsDate = new Date(
        parsedDate.year(),
        parsedDate.month(),
        parsedDate.date(),
        10,
        0,
        0
      );
      setDateValue(jsDate);
      onChange(jsDate);
    } else if (formatted === "") {
      setDateValue(null);
      // only call onChange with null if it's safe
      if (onChange) {
        onChange(null);
      }
    }
  };

  const handleKeyDown = (e) => {
    // allow control/meta shortcuts
    if (e.ctrlKey || e.metaKey) return;
    const allowed = ["Backspace", "ArrowLeft", "ArrowRight", "Delete", "Tab"];
    if (allowed.includes(e.key)) return;
    if (/\d/.test(e.key)) return;
    // prevent any other chars (including letters)
    e.preventDefault();
  };

  const handleInputClick = () => {
    if (!isTyping) {
      datePickerRef.current.setOpen(true);
    }
  };

  return (
    <div className="tdk-datepicker-container">
      {label && <label className="tdk-datepicker-label">{label}</label>}
      <div className="tdk-datepicker-input-container">
        <input
          required={required}
          type="text"
          autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
          className="tdk-datepicker-input"
          ref={inputRef}
          value={displayValue}
          placeholder="dd/mm/yyyy"
          disabled={disabled}
          style={{ width }}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onClick={handleInputClick}
          onBlur={() => setIsTyping(false)}
        />
        <CalendarTodayIcon
          className="tdk-datepicker-icon"
          onClick={() => datePickerRef.current.setOpen(true)}
        />
      </div>
      <DatePicker
        ref={datePickerRef}
        selected={dateValue}
        onChange={(date) => {
          setDateValue(date);
          onChange(date);
        }}
        dateFormat="dd/MM/yyyy"
        customInput={<div />}
        popperClassName="custom-datepicker-popper"
        popperPlacement="bottom-start"
        minDate={minDate ? new Date(minDate) : null}
        fixedHeight
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
      />
    </div>
  );
};

export default TdkDatePicker;