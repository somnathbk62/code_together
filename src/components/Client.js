import React from "react";
import Avatar from "react-avatar";

const Client = ({ username }) => {
  // Create custom initials function to limit to 4 characters
  const getInitials = () => {
    return username.substring(0, 4);
  };

  return (
    <div className="client" title={username}>
      <Avatar
        name={username}
        size={50}
        round="14px"
        textSizeRatio={1.75}
        color="var(--primary)"
        fgColor="var(--bg-primary)"
        initials={getInitials()}
      />
    </div>
  );
};

export default Client;
