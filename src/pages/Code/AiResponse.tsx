import React from "react";
import TextField from "@mui/material/TextField";

const test = `
Title: Booking a Flight Ticket

As a frequent traveler,
I want to be able to book a flight ticket online,
So that I can plan my travels conveniently and efficiently.

Acceptance Criteria:

1. As a user, I should be able to search for flights by entering my departure and arrival destinations.
2. As a user, I should be able to choose the date of my departure and return.
3. As a user, I should be able to select the number of passengers traveling.
4. As a user, I should be able to filter flights by price, duration, and airlines.
5. As a user, I should be able to select a flight based on my preferred time and price.
6. As a user, I should be able to view the details of the selected flight including total travel time, layovers, and amenities provided.
7. As a user, I should be able to enter passenger details including name, age, and any special requests.
8. As a user, I should be able to select my preferred seat.
9. As a user, I should be able to review all the details before making the payment.
10. As a user, I should be able to make a payment using my preferred method (credit card, debit card, net banking, etc.).
11. As a user, I should receive a confirmation email with all the details of my flight after successful booking.`;
const UserChat: React.FC<any> = ({ chat }) => {
  return (
    <div>
      <div className="chat-msg-list msg-hldr-usr">
        <div data-name="message-stack-0" className="chat-msg-stack">
          <div className="chat-indv">
            <TextField
              defaultValue={test}
              variant="outlined"
              multiline
              fullWidth
            />
          </div>
          <span className="chat-time chat-time-usr">{chat.time}</span>
        </div>
      </div>
    </div>
  );
};

export default UserChat;
