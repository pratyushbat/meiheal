export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface Alert {
    id?: string;
    type: AlertType;
    message: string;
    timeout?: number; // auto close (ms)
}
