export type LoginFormProps = {
    onLogin: (email: string, password: string) => Promise<void>; // <--- HERE IS THE CHANGE
    onSwitchToSignup: () => void;
}
export type SignUpFormProps = {
    onSignup: (
        name: string,
        email: string,
        password: string,
        currentGrade?: string,
        country?: string,
        phoneNumber?: string
    ) => Promise<void>;
    onSwitchToLogin: () => void;
}