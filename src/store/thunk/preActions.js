import { toast } from "react-toastify";
import { del, postMultiPartFormData } from "../../api";

export const createUpdatePreActions = (formData, siteId) => {
  return async (dispatch) => {
    try {
      const url = `/api/action/${siteId}/actions`;
      const res = await postMultiPartFormData(url, formData);
      if (res?.status === 200) {
        toast.success("Pre action details has been successfully saved.");
      } else {
        toast.error("Something went wrong while saving pre action details.");
      }
    } catch (error) {
      toast.error("Something went wrong while saving pre action details.");
    }
  };
};

export const deletePreAction = (id) => {
  return async () => {
    try {
      const url = `/api/action/${id}/delete`;
      await del(url);
      return "Success";
    } catch (error) {
      return "Error";
    }
  };
};
