import * as React from "react";
import { useUI } from "./context";

export const Button: React.FC<any> = (props) => {
  const { Button } = useUI();
  const Cmp = Button as any;
  return <Cmp {...props} />;
};

export const Badge: React.FC<any> = (props) => {
  const { Badge } = useUI();
  const Cmp = Badge as any;
  return <Cmp {...props} />;
};

export const Flag: React.FC<any> = (props) => {
  const { Flag } = useUI();
  const Cmp = Flag as any;
  return <Cmp {...props} />;
};


