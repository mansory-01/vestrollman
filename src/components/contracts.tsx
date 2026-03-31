"use client";

import React, { useState } from "react";
import Stepper from "./ui/stepper";
import { ProjectDetails } from "@/components/features/contracts/project-details";
import { ContractType } from "@/components/features/contracts/contract-type";
import { EmployeeDetails } from "@/components/features/contracts/employee-details";
import ContractDetails from "@/components/features/contracts/contract-details";
import Compliance from "@/components/features/contracts/compliance";

const steps = [
  { id: 1, title: "Choose Contract type", content: <ContractType /> },
  { id: 2, title: "Project Details", content: <ProjectDetails /> },
  { id: 3, title: "Employee Details", content: <EmployeeDetails /> },
  { id: 4, title: "Contract Details", content: <ContractDetails /> },
  { id: 5, title: "Compliance", content: <Compliance /> },
  { id: 6, title: "Review & Sign", content: <EmployeeDetails /> },
];

/**
 * Contracts multi-step form component.
 * Manages the state and navigation for creating a new contract.
 */
function Contracts() {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="min-h-[50vh] rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm"
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <h2 className="font-semibold text-xl text-gray-900">
            {steps[activeStep].title}
          </h2>
          <Stepper
            steps={steps}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
          />
        </div>
        <StepContent steps={steps} activeStep={activeStep} />
        <StepControls
          steps={steps}
          activeStep={activeStep}
          handleBack={handleBack}
          handleNext={handleNext}
        />
      </div>
    </form>
  );
}

interface Step {
  id: number;
  title: string;
  content: React.ReactNode;
}

/**
 * Renders the content of the current step.
 */
function StepContent({
  steps,
  activeStep,
}: {
  steps: Step[];
  activeStep: number;
}) {
  if (!steps[activeStep]) return null;
  return <div className="py-10">{steps[activeStep].content}</div>;
}

/**
 * Navigation controls for the multi-step form.
 */
function StepControls({
  steps,
  activeStep,
  handleBack,
  handleNext,
}: {
  steps: Step[];
  activeStep: number;
  handleBack: () => void;
  handleNext: () => void;
}) {
  return (
    <div className="flex items-center">
      <button
        disabled={activeStep === 0}
        onClick={handleBack}
        className="flex-1 text-purple-700 hover:text-white border border-purple-700 hover:bg-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-purple-400 dark:text-purple-400 dark:hover:text-white dark:hover:bg-purple-500 dark:focus:ring-purple-900 duration-200"
      >
        Back
      </button>
      <button
        onClick={handleNext}
        className="flex-1 focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900 duration-200"
      >
        {activeStep === steps.length - 1 ? "Finish" : "Next"}
      </button>
    </div>
  );
}

export default Contracts;
