/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { Button, Forms, i18n, Menu } from "@webpack/common";
import { ReactElement } from "react";

import { cl, QrCodeCameraIcon } from "./ui";
import openQrModal from "./ui/modals/QrModal";

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
        "Allows you to login to another device by scanning a login QR code, just like on mobile!",
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
                    <Button size={Button.Sizes.SMALL} onClick={openQrModal}>
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
                // Find the Edit User Profile button and insert our custom button.
                // A bit jank, but whatever
                match: /,(.{11}\.Button,.{58}\.USER_SETTINGS_EDIT_USER_PROFILE}\))/,
                replace: ",$self.insertScanQrButton($1)",
            },
        },
        // Prevent paste event from firing when the QRModal is open
        {
            find: ".clipboardData&&(",
            replacement: {
                // Find the handleGlobalPaste & handlePaste functions and prevent
                // them from firing when the modal is open. Does this have any
                // side effects? Maybe
                match: /handle(Global)?Paste:(\i)(}|,)/g,
                replace:
                    "handle$1Paste:(...args)=>!$self.qrModalOpen&&$2(...args)$3",
            },
        },
        // Insert a Scan QR MenuItem in the simplified user popout
        {
            find: "Messages.MULTI_ACCOUNT_MENU_LABEL",
            replacement: {
                // Insert our own MenuItem before the Switch Account button
                match: /children:\[(.{54}id:"switch-account")/,
                replace: "children:[$self.ScanQrMenuItem,$1",
            },
        },
    ],

    qrModalOpen: false,

    insertScanQrButton: (button: ReactElement) => (
        <div className={cl("settings-btns")}>
            <Button size={Button.Sizes.SMALL} onClick={openQrModal}>
                {i18n.Messages.USER_SETTINGS_SCAN_QR_CODE}
            </Button>
            {button}
        </div>
    ),

    get ScanQrMenuItem() {
        return (
            <Menu.MenuGroup>
                <Menu.MenuItem
                    id="scan-qr"
                    label={i18n.Messages.USER_SETTINGS_SCAN_QR_CODE}
                    icon={QrCodeCameraIcon}
                    action={openQrModal}
                    showIconFirst
                    focusedClassName={cl("menuitem-focused")}
                    subMenuIconClassName={cl("submenu-icon")}
                />
            </Menu.MenuGroup>
        );
    },
});
