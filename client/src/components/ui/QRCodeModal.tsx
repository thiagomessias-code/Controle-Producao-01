import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import QRCodeViewer from "./QRCodeViewer";

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    value: string;
    title: string;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
    isOpen,
    onClose,
    value,
    title,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center p-4">
                    <QRCodeViewer value={value} title={title} />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default QRCodeModal;
