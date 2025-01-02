import * as React from "react";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";

declare global {
  interface Window {
    pageLoader: (state: boolean) => void;
  }
}

export default function SimpleBackdrop() {
  const [open, setOpen] = React.useState(false);
  const handleClose = () => {
    setOpen(false);
  };

  React.useEffect(() => {
    (window as any).pageLoader = setOpen;
    return () => {
      delete (window as any).setOpen;
    };
  }, []);

  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <div>
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
        open={open}
        onClick={handleClose}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );
}
