import { useAppDispatch } from "./redux.types";
import { openModal, closeModal, ModalProps } from "@/lib/slice/modalSlice";

interface ModalButton {
  text: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "success";
  disabled?: boolean;
  className?: string;
}

interface CustomModalOptions {
  title?: string;
  size?: ModalProps["size"];
  showButtons?: boolean;
  buttons?: ModalButton[];
  showCloseButton?: boolean;
  onCancel?: () => void;
  fullScreen?: boolean;
}

/**
 * Hook for managing application-wide modals via Redux.
 * Provides helper methods for common modal types (info, success, error, confirm, etc.)
 */
const useModal = () => {
  const dispatch = useAppDispatch();

  /**
   * Displays a generic modal with the provided properties.
   */
  const showModal = (modalProps: ModalProps) => {
    dispatch(openModal(modalProps));
  };

  /**
   * Hides the currently active modal.
   */
  const hideModal = () => {
    dispatch(closeModal());
  };

  /**
   * Displays an information modal.
   */
  const showInfoModal = (
    title: string,
    content: React.ReactNode | string,
    confirmText = "OK"
  ) => {
    showModal({
      title,
      content,
      confirmText,
      type: "info",
    });
  };

  /**
   * Displays a success modal.
   */
  const showSuccessModal = (
    title: string,
    content: React.ReactNode | string,
    confirmText = "OK"
  ) => {
    showModal({
      title,
      content,
      confirmText,
      type: "success",
    });
  };

  /**
   * Displays an error modal.
   */
  const showErrorModal = (
    title: string,
    content: React.ReactNode | string,
    confirmText = "OK"
  ) => {
    showModal({
      title,
      content,
      confirmText,
      type: "error",
    });
  };

  /**
   * Displays a warning modal.
   */
  const showWarningModal = (
    title: string,
    content: React.ReactNode | string,
    confirmText = "OK"
  ) => {
    showModal({
      title,
      content,
      confirmText,
      type: "warning",
    });
  };

  /**
   * Displays a confirmation modal with 'Confirm' and 'Cancel' options.
   */
  const showConfirmModal = (
    title: string,
    content: React.ReactNode | string,
    onConfirm: () => void,
    confirmText = "Confirm",
    cancelText = "Cancel"
  ) => {
    showModal({
      title,
      content,
      confirmText,
      cancelText,
      onConfirm,
      type: "confirm",
      buttons: [
        {
          text: cancelText,
          variant: "secondary",
          onClick: () => {
          },
        },
        {
          text: confirmText,
          variant: "primary",
          onClick: onConfirm,
        },
      ],
    });
  };

  /**
   * Displays a custom component within a modal.
   */
  const showCustomModal = (
    customComponent: React.ReactNode,
    size?: ModalProps["size"]
  ) => {
    showModal({
      customComponent,
      size,
      type: "custom",
      showButtons: false, 
    });
  };

  /**
   * Displays content-only modal with custom configuration.
   */
  const showContentOnlyModal = (
    content: React.ReactNode,
    options: CustomModalOptions = {}
  ) => {
    showModal({
      title: options.title,
      content,
      size: options.size || "md",
      showButtons: false,
      showCloseButton: options.showCloseButton ?? true,
      fullScreen: options.fullScreen ?? false,
      onCancel: options.onCancel,
      type: "custom",
    });
  };

  /**
   * Displays a modal with custom buttons.
   */
  const showModalWithButtons = (
    title: string,
    content: React.ReactNode | string,
    buttons: ModalButton[],
    options: Omit<CustomModalOptions, "buttons"> = {}
  ) => {
    showModal({
      title,
      content,
      buttons,
      size: options.size || "md",
      showButtons: true,
      showCloseButton: options.showCloseButton ?? true,
      onCancel: options.onCancel,
      type: "custom",
    });
  };

  /**
   * Displays an enhanced modal with full control over buttons and display options.
   */
  const showEnhancedModal = (
    content: React.ReactNode,
    options: CustomModalOptions = {}
  ) => {
    showModal({
      title: options.title,
      content,
      size: options.size || "md",
      showButtons: options.showButtons ?? false,
      buttons: options.buttons || [],
      showCloseButton: options.showCloseButton ?? true,
      onCancel: options.onCancel,
      type: "custom",
    });
  };

  /**
   * Displays a modal that forces a user action (no close button).
   */
  const showForceActionModal = (
    title: string,
    content: React.ReactNode | string,
    buttons: ModalButton[],
    size: ModalProps["size"] = "md"
  ) => {
    showModal({
      title,
      content,
      buttons,
      size,
      showButtons: true,
      showCloseButton: false, 
      type: "custom",
    });
  };

  /**
   * Displays a loading modal (no interaction allowed).
   */
  const showLoadingModal = (
    title: string,
    content: React.ReactNode | string,
    size: ModalProps["size"] = "sm"
  ) => {
    showModal({
      title,
      content,
      size,
      showButtons: false,
      showCloseButton: false,
      type: "custom",
    });
  };

  return {
    showModal,
    hideModal,
    showInfoModal,
    showSuccessModal,
    showErrorModal,
    showWarningModal,
    showConfirmModal,
    showCustomModal,
    showContentOnlyModal,
    showModalWithButtons,
    showEnhancedModal,
    showForceActionModal,
    showLoadingModal,
  };
};

export default useModal;
