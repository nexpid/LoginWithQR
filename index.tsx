/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { Button, Forms, i18n } from "@webpack/common";
import { ReactElement } from "react";

import { cl } from "./ui";
import openQRModal from "./ui/modals/QRModal";

export let jsQR: (
    img: Uint8ClampedArray,
    width: number,
    height: number
) => {
    binaryData: number[];
    data: string;
    chunks: any[];
    version: number;
    location: object;
};
import("./jsQR.min.js").then(x => (jsQR = x.default));

export default definePlugin({
    name: "LoginWithQR",
    description:
        "Allows you to login by scanning a QR code like the mobile app",
    // replace with EquicordDevs.nexpid when merged to Equicord
    authors: [
        {
            name: "Nexpid",
            id: 853550207039832084n,
        },
    ],

    settings: definePluginSettings({
        scanQr: {
            type: OptionType.COMPONENT,
            description: "Scan a QR code",
            component() {
                if (!Vencord.Plugins.plugins.LoginWithQR.started)
                    return (
                        <Forms.FormText>
                            Enable the plugin and restart your client to scan a
                            login QR code
                        </Forms.FormText>
                    );

                return (
                    <Button size={Button.Sizes.SMALL} onClick={openQRModal}>
                        {i18n.Messages.USER_SETTINGS_SCAN_QR_CODE}
                    </Button>
                );
            },
        },
    }),

    patches: [
        // Insert the Scan QR button in the My Account tab
        {
            find: "UserSettingsAccountProfileCard",
            replacement: {
                // Find the Edit User Profile button and insert our custom button
                // A bit jank, but whatever
                match: /,(.{11}\.Button,.{58}\.USER_SETTINGS_EDIT_USER_PROFILE}\))/,
                replace: ",$self.insertScanQRButton($1)",
            },
        },
        // Prevent paste event from firing when the QRModal is open
        {
            find: ".clipboardData&&(",
            replacement: {
                match: /handle(Global)?Paste:(\i)(}|,)/g,
                replace:
                    "handle$1Paste:(...args)=>!$self.qrModalOpen&&$2(...args)$3",
            },
        },
    ],

    qrModalOpen: false,

    insertScanQRButton: (button: ReactElement) => (
        <div className={cl("settings-btns")}>
            <Button size={Button.Sizes.SMALL} onClick={openQRModal}>
                {i18n.Messages.USER_SETTINGS_SCAN_QR_CODE}
            </Button>
            {button}
        </div>
    ),
});
