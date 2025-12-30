import { jsx as _jsx } from "react/jsx-runtime";
export const Button = ({ label, onClick }) => {
    return (_jsx("button", { onClick: onClick, "data-testid": "button", children: label }));
};
