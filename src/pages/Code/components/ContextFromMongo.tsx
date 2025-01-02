import React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Divider from "@mui/material/Divider";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import DescriptionIcon from "@mui/icons-material/Description";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

interface Result {
  page_number: number;
  text: string;
  doc_name: string;
}

interface Props {
  data: any;
  results: Result[];
}

const ContextFromMongo: React.FC<any> = ({ data = [] }: any) => {
  console.log("==============results===>", data);
  return (
    <div>
      <Accordion>
        <AccordionSummary
          expandIcon={<ArrowDownwardIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
        >
          Context texts
        </AccordionSummary>
        <AccordionDetails>
          <>
            {data?.map((result: Result, index: number) => (
              <div key={index}>
                <h2>Page Number: {result.page_number}</h2>

                <Typography
                  component="b"
                  variant="body2"
                  sx={{ color: "text.primary", display: "inline" }}
                >
                  <b>{result.doc_name}</b>
                </Typography>
                <br />
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ color: "text.primary", display: "inline" }}
                >
                  {result.text}
                </Typography>
              </div>
            ))}
          </>
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

export default ContextFromMongo;
