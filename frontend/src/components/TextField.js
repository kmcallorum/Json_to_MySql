import { jsx as _jsx } from "react/jsx-runtime";
export const TextField = ({ value, onChange, placeholder }) => {
    return (_jsx("input", { type: "text", value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, "data-testid": "textfield" }));
};
