/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { classNameFactory } from "@api/Styles";
import { findComponentByCodeLazy } from "@webpack";
import { ComponentType, HTMLAttributes } from "react";

export enum SpinnerTypes {
    WANDERING_CUBES = "wanderingCubes",
    CHASING_DOTS = "chasingDots",
    PULSING_ELLIPSIS = "pulsingEllipsis",
    SPINNING_CIRCLE = "spinningCircle",
    SPINNING_CIRCLE_SIMPLE = "spinningCircleSimple",
    LOW_MOTION = "lowMotion",
}

type Spinner = ComponentType<Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    type?: SpinnerTypes;
    animated?: boolean;
    className?: string;
    itemClassName?: string;
    "aria-label"?: string;
}> & {
    Type: typeof SpinnerTypes;
};

export const Spinner = findComponentByCodeLazy('"pulsingEllipsis"') as Spinner;

export const QrCodeIcon = findComponentByCodeLazy("0v3ZM20");

export const cl = classNameFactory("qrlogin-");
