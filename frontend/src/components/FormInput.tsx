import React from "react";
import { FieldError } from "react-hook-form";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: FieldError;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  children?: React.ReactNode;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      error,
      id,
      containerClassName = "",
      labelClassName = "",
      inputClassName = "",
      children,
      ...props
    },
    ref
  ) => (
    <div className={containerClassName + " w-full"}>
      <label
        htmlFor={id}
        className={
          "block text-sm font-medium text-gray-200 mb-2 " + labelClassName
        }
      >
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          className={
            "w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all hover:bg-white/20 " +
            inputClassName
          }
          {...props}
        />
        {children}
      </div>
      {error && <p className="text-red-400 text-sm mt-1">{error.message}</p>}
    </div>
  )
);

FormInput.displayName = "FormInput";

export default FormInput;
