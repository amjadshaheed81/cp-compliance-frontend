import React, { Fragment, useEffect, useState } from "react";
import { Alert, Button } from "@mui/material";
import { connect } from "react-redux";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useForm } from "react-hook-form";
import { Validation } from "../../../../Constant/Validation";
import { InputError } from "../../../common/InputError";
import { cloneAsset } from "../../../../store/thunk/site";
import { toast } from "react-toastify";

const ShowCloneModal = ({
  showCloneModal,
  setShowCloneModal,
  selectedAsset,
  refresh,
  cloneAsset,
}) => {
  const {
    register,
    reset,
    watch,
    formState: { errors },
    handleSubmit,
    setValue,
    getValues,
  } = useForm({});
  const handleOpen = () => setShowCloneModal(true);
  const handleClose = () => setShowCloneModal(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAsset, setCurrentAsset] = useState(false);
  useEffect(() => {
    setCurrentAsset(selectedAsset);
    reset(selectedAsset)
  }, [selectedAsset]);
  const handlePrint = () => {
    window.print();
  };
  const submitClone = async (data) => {
    setIsLoading(true);
    const res = await cloneAsset(data?.assetId, Number(data?.numberOfClones));
    if (res === "Success") {
      toast.success("Asset cloning is successfully completed.");
        setShowCloneModal(false);
        refresh();
    } else if (res?.includes("BlobNotFound")) {
      toast.error(
        `Site image blob not found.`
      );
    } else {
      toast.error("Something went wrong while asset clone.");
    }
    setIsLoading(false);
  };
  return (
    <React.Fragment>
      <Dialog
        open={showCloneModal}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
      >
        <form onSubmit={handleSubmit(submitClone)}>
          <DialogTitle>Clone Asset</DialogTitle>
          <DialogContent dividers>
            {!isLoading && (
              <Fragment>
                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group mt-2">
                      <label for="assetName">Asset Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="assetName"
                        name="assetName"
                        disabled
                        placeholder=""
                        {...register("assetName", {
                          required: {
                            value: true,
                            message: `${Validation.REQUIRED} asset name`,
                          },
                        })}
                      />
                      {errors?.assetName && (
                        <InputError
                          message={errors?.assetName?.message}
                          key={errors?.assetName?.message}
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mt-2">
                      <label for="manufacturer">Manufacturer</label>
                      <input
                        type="text"
                        className="form-control"
                        id="manufacturer"
                        name="manufacturer"
                        disabled
                        placeholder=""
                        {...register("manufacturer", {
                          required: {
                            value: true,
                            message: `${Validation.REQUIRED} manufacturer`,
                          },
                        })}
                      />
                      {errors?.manufacturer && (
                        <InputError
                          message={errors?.manufacturer?.message}
                          key={errors?.manufacturer?.message}
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-md-12">
                    <Alert severity="warning">
                      You are about to create copies of the above mentioned
                      asset. Once created, you will have to manually edit the
                      details of the asset. The created clone names will begin
                      with prefix “Clone-”.
                    </Alert>
                  </div>
                  <div className="col-md-12">
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="numberOfClones">
                          Select Number of Clones to Create
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          {...register("numberOfClones", {
                            required: {
                              value: true,
                              message: `Please select number of clones to create`,
                            },
                            validate: (value) => value > 0 || "Number of clones cannot be negative",
                          })}
                        />
                        {errors?.numberOfClones && (
                          <InputError
                            message={errors?.numberOfClones?.message}
                            key={errors?.numberOfClones?.message}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Fragment>
            )}
          </DialogContent>
          {!isLoading && (
            <DialogActions>
              <Button
                onClick={handleClose}
                className="bg-light text-primary no-print-element"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-light no-print-element"
              >
                Clone
              </Button>
            </DialogActions>
          )}
        </form>
      </Dialog>
    </React.Fragment>
  );
};

const mapStateToProps = () => ({});
export default connect(mapStateToProps, {cloneAsset})(ShowCloneModal);
