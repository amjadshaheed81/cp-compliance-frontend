import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { InputError } from "../../../common/InputError";
import { get, put } from "../../../../api";
import { toast } from "react-toastify";

const AddPatDetails = ({
  showPatModal,
  setShowPatModal,
  selectedAsset,
  refresh,
}) => {
  const [open, setOpen] = useState(showPatModal);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [tester, setTester] = useState([]);
  const getTester = async () => {
    const url = `/api/user/all`;
    const data = await get(url);
    setTester(data?.users?.sort((a, b) => {
      if (a.name < b.name) {
          return -1; // a comes before b
      }
      if (a.name > b.name) {
          return 1;  // b comes before a
      }
      return 0; // names are equal
  }));
  };

  useEffect(() => {
    getTester();
  }, []);

  const handleOpen = () => setShowPatModal(true);
  const handleClose = () => {
    setShowPatModal(false);
  };
  function formatPATDates(assetPATItems) {
    return assetPATItems.map((item) => {
      if (item.patDate) {
        item.patDate = item.patDate.replace("T", " ");
      }
      if (item.patNextDate) {
        item.patNextDate = item.patNextDate.replace("T", " ");
      }
      return item;
    });
  }
  const submitPatRecords = async (data) => {
    setIsLoading(true);
    for (let itm of selectedAsset) {
      console.log("itm", itm);
      let payload = [];
      if (itm?.assetPATItems?.length > 0) {
        payload.push(...itm?.assetPATItems, {
          ...data,
          patDate: `${data.patDate} 10:00:00`,
          patNextDate: `${data.patNextDate} 10:00:00`,
          patId: null,
          assetId: itm?.assetId,
          patUserId: selectedUser,
        });
      } else {
        payload.push({
          ...data,
          patDate: `${data.patDate} 10:00:00`,
          patNextDate: `${data.patNextDate} 10:00:00`,
          patId: null,
          assetId: itm?.assetId,
          patUserId: selectedUser,
        });
      }
      const url = `/api/site/assets/${itm?.assetId}/patDetails`;
      const res = await put(url, {
        assetPATItems: formatPATDates(payload),
        deletedPatIds: [],
      });
    }
    setIsLoading(false);
    handleClose();
    refresh();
    toast.success("Pat register update is successfully updated.");
  };
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({});
  return (
    <>
      <Dialog open={open} maxWidth="lg" fullWidth onClose={handleClose}>
        <form onSubmit={handleSubmit(submitPatRecords)}>
          <DialogTitle>Pat Register</DialogTitle>
          <DialogContent>
            <div className="row">
              <div className="col-md-4">
                <div className="form-group mt-2">
                  <label for="email">Pass/Fail</label>
                  <select
                    name="patStatus"
                    className="form-control form-select"
                    id="patStatus"
                    {...register("patStatus", {
                      required: {
                        value: true,
                        message: `Please select Pass/Fail.`,
                      },
                    })}
                  >
                    <option value="">Select</option>
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                  {errors?.patStatus && (
                    <InputError
                      message={errors?.patStatus?.message}
                      key={errors?.patStatus?.message}
                    />
                  )}
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group mt-2">
                  <label for="patDate">Tested Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="patDate"
                    name="patDate"
                    placeholder="dd/mm/yyyy"
                    {...register("patDate", {
                      required: {
                        value: true,
                        message: `Please select tested date.`,
                      },
                    })}
                  />
                  {errors?.patDate && (
                    <InputError
                      message={errors?.patDate?.message}
                      key={errors?.patDate?.message}
                    />
                  )}
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group mt-2">
                  <label for="patNextDate">Next Tested Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="patNextDate"
                    name="patNextDate"
                    placeholder="dd/mm/yyyy"
                    {...register("patNextDate", {
                      required: {
                        value: true,
                        message: `Please select next tested date.`,
                      },
                    })}
                  />
                  {errors?.patNextDate && (
                    <InputError
                      message={errors?.patNextDate?.message}
                      key={errors?.patNextDate?.message}
                    />
                  )}
                </div>
              </div>
              <div className="col-md-4">
                <label for="patUserId">Tested By</label>

                <Autocomplete
                  id="patUserId"
                  onChange={(event, newValue) => {
                    console.log(newValue);
                    setSelectedUser(newValue?.key);
                  }}
                  options={tester.map((option) => {
                    return {
                      key: option.id,
                      label:
                        option.role +
                        " - " +
                        option.name +
                        " (" +
                        option.email +
                        ")" +
                        (option.companyName ? " - " + option.companyName : ""),
                    };
                  })}
                  getOptionLabel={(option) => option.label}
                  renderInput={(params) => (
                    <div ref={params.InputProps.ref}>
                      <input
                        type="text"
                        {...params.inputProps}
                        required
                        className="form-control"
                        placeholder="Select User"
                      />
                    </div>
                  )}
                />
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            {isLoading && (
              <Box sx={{ display: "flex" }}>
                <CircularProgress />
              </Box>
            )}
            {!isLoading && (
              <>
                {" "}
                <Button onClick={handleClose} className="bg-light text-primary">
                  Close
                </Button>
                <Button type="submit" className="bg-primary text-light">
                  Save
                </Button>
              </>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default AddPatDetails;
