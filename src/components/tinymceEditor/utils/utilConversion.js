

// 单位换算
const utilConversion = {
    PT_PER_PX: 0.75,
    IN_PER_PT: 72,
    CM_PER_PT: 28.3,
    MM_PER_PT: 2.83,
    EMU_PER_PX: 9525
}

const utilFun = {
    emuToPx(emu) {
        return Math.round(emu / utilConversion.EMU_PER_PX);
    },
    ptToPx(pt) {
        return Math.round(pt / utilConversion.PT_PER_PX);
    },
    inToPx(inch) {
        return Math.round(this.inToPt(inch) * utilConversion.PT_PER_PX);
    },
    inToPt(inch) {
        return Math.round(inch * utilConversion.IN_PER_PT);
    },
    cmToPx(cm) {
        return Math.round(this.cmToPt(cm) * utilConversion.PT_PER_PX);
    },
    cmToPt(cm) {
        return Math.round(cm * utilConversion.CM_PER_PT);
    }
}
export default utilFun;