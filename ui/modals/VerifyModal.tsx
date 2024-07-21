/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {
    ModalContent,
    ModalFooter,
    ModalProps,
    ModalRoot,
    ModalSize,
    openModal,
} from "@utils/modal";
import { findByPropsLazy } from "@webpack";
import {
    Button,
    i18n,
    RestAPI,
    Text,
    useEffect,
    useRef,
    useState,
} from "@webpack/common";

import { cl } from "..";

const { Controller } = findByPropsLazy("Controller");

enum VerifyState {
    Verifying,
    LoggedIn,
    NotFound,
}

export enum AbortStatus {
    Abort,
    Fail,
    Success,
}

function VerifyModal({
    token,
    onAbort,
    closeMain,
    ...props
}: {
    token: string | null;
    onAbort: () => void;
    closeMain: () => void;
} & ModalProps) {
    const [state, setState] = useState(
        !token ? VerifyState.NotFound : VerifyState.Verifying
    );
    useEffect(() => () => void (state !== VerifyState.LoggedIn && onAbort()), []);

    const [inProgress, setInProgress] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>();
    const controllerRef = useRef(new Controller({ progress: "0%" })).current;

    const holdDuration = 1000;
    let timeout: any;
    const startInput = () => {
        if (!buttonRef.current) return;

        controllerRef.start({
            progress: "100%",
            config: {
                duration: holdDuration,
                // https://easings.net/#easeInOutSine
                easing: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
            },
        });
        timeout = setTimeout(() => {
            if (state !== VerifyState.Verifying) return;

            setInProgress(true);
            RestAPI.post({
                url: "/users/@me/remote-auth/finish",
                body: {
                    handshake_token: token,
                },
            })
                .then(() => {
                    closeMain();
                    setState(VerifyState.LoggedIn);
                })
                .catch(() => setState(VerifyState.NotFound))
                .finally(() => setInProgress(false));
        }, holdDuration + 250);
    };

    const endInput = () => {
        if (!buttonRef.current) return;

        controllerRef.start({
            progress: "0%",
            config: {
                duration: 696,
                // https://easings.net/#easeOutCubic
                easing: (t: number) => 1 - Math.pow(1 - t, 3),
            },
        });
        clearTimeout(timeout);
    };

    useEffect(() => {
        let frame: number;
        const update = () => {
            buttonRef.current?.style.setProperty(
                "--progress",
                controllerRef.get().progress
            );

            frame = requestAnimationFrame(update);
        };

        if (state === VerifyState.Verifying) requestAnimationFrame(update);
        return () => cancelAnimationFrame(frame);
    }, [state]);

    return (
        <ModalRoot size={ModalSize.DYNAMIC} {...props}>
            <ModalContent scrollbarType="none" className={cl("device-content")}>
                {state === VerifyState.LoggedIn ? (
                    <>
                        <img
                            className={cl("device-image")}
                            src="https://github.com/nexpid/Themelings/raw/data/icons/images/native/img_remote_auth_succeeded.png"
                            key="img-success"
                            draggable={false}
                        />
                        <Text
                            variant="heading-xl/bold"
                            color="header-primary"
                            tag="h1"
                            className={cl("device-header")}
                        >
                            {i18n.Messages.QR_CODE_LOGIN_SUCCESS}
                        </Text>
                        <Text
                            variant="text-md/semibold"
                            color="text-normal"
                            style={{ width: "30rem" }}
                        >
                            {i18n.Messages.QR_CODE_LOGIN_SUCCESS_FLAVOR}
                        </Text>
                    </>
                ) : state === VerifyState.NotFound ? (
                    <>
                        <img
                            className={cl("device-image")}
                            src="https://github.com/nexpid/Themelings/raw/data/icons/images/native/img_remote_auth_not_found.png"
                            key="img-not_found"
                            draggable={false}
                        />
                        <Text
                            variant="heading-xl/bold"
                            color="header-primary"
                            tag="h1"
                            className={cl("device-header")}
                        >
                            {i18n.Messages.QR_CODE_NOT_FOUND}
                        </Text>
                        <Text
                            variant="text-md/semibold"
                            color="text-normal"
                            style={{ width: "30rem" }}
                        >
                            {i18n.Messages.QR_CODE_NOT_FOUND_DESCRIPTION}
                        </Text>
                    </>
                ) : (
                    <>
                        <img
                            className={cl("device-image")}
                            src="https://github.com/nexpid/Themelings/raw/data/icons/images/native/img_remote_auth_loaded.png"
                            key="img-loaded"
                            draggable={false}
                        />
                        <Text
                            variant="heading-xl/bold"
                            color="header-primary"
                            tag="h1"
                            className={cl("device-header")}
                        >
                            {i18n.Messages.QR_CODE_LOGIN_CONFIRM}
                        </Text>
                        <Text variant="text-md/semibold" color="text-danger">
                            Never scan a login QR code from another user or
                            application.
                        </Text>
                        <Button
                            size={Button.Sizes.LARGE}
                            color={Button.Colors.RED}
                            className={cl("device-confirm")}
                            style={{
                                ["--duration" as any]: `${holdDuration}ms`,
                            }}
                            onPointerDown={startInput}
                            onPointerUp={endInput}
                            // @ts-expect-error stop whining about refs
                            buttonRef={buttonRef}
                            disabled={inProgress}
                        >
                            Hold to confirm login
                        </Button>
                    </>
                )}
            </ModalContent>
            <ModalFooter className={cl("device-footer")}>
                {state === VerifyState.LoggedIn ? (
                    <Button onClick={props.onClose}>
                        {i18n.Messages.QR_CODE_LOGIN_FINISH_BUTTON}
                    </Button>
                ) : (
                    <Button
                        color={Button.Colors.LINK}
                        look={Button.Looks.LINK}
                        onClick={props.onClose}
                    >
                        {state === VerifyState.NotFound
                            ? i18n.Messages.CLOSE
                            : i18n.Messages.CANCEL}
                    </Button>
                )}
            </ModalFooter>
        </ModalRoot>
    );
}

export default function openVerifyModal(
    token: string | null,
    onAbort: () => void,
    closeMain: () => void
) {
    return openModal(props => (
        <VerifyModal {...props} token={token} onAbort={onAbort} closeMain={closeMain} />
    ));
}
