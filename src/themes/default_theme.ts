import { Theme, ThemeModalStyle, ThemeProperties } from './commons';

const modalThemeStyle: ThemeModalStyle = {
    content: {
        backgroundColor: '#fff',
        bottom: 'auto',
        borderColor: '#dedede',
        flexGrow: '0',
        left: 'auto',
        minWidth: '350px',
        position: 'relative',
        right: 'auto',
        top: 'auto',
    },
    overlay: {
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        justifyContent: 'center',
        zIndex: '12345',
    },
};

const whiteThemeColors: ThemeProperties = {
    background: '#f4f3f4',
    borderColor: '#dedede',
    boxShadow: '0 10px 10px rgba(0, 0, 0, 0.1)',
    buttonConvertBackgroundColor: '#fff',
    buttonConvertBorderColor: '#dedede',
    buttonConvertTextColor: '#474747',
    buttonErrorBackgroundColor: '#FF6534',
    buttonPrimaryBackgroundColor: '#002979',
    buttonSecondaryBackgroundColor: '#474747',
    buttonSellBackgroundColor: '#00AE99',
    buttonTertiaryBackgroundColor: '#F6851B',
    buttonTextColor: '#fff',
    cardBackgroundColor: '#fff',
    cardBorderColor: '#dedede',
    cardTitleColor: '#000',
    darkBlue: '#002979',
    darkGray: '#474747',
    darkerGray: '#666',
    dropdownBackgroundColor: '#fff',
    dropdownBorderColor: '#dedede',
    dropdownTextColor: '#000',
    errorButtonBackground: '#FF6534',
    errorCardBackground: '#FAF4EF',
    errorCardBorder: '#F39E4B',
    errorCardText: '#F68C24',
    ethBoxActiveColor: '#002979',
    ethBoxBorderColor: '#dedede',
    ethSetMinEthButtonBorderColor: '#000',
    ethSliderThumbBorderColor: 'rgba(0, 0, 0, 0.142)',
    ethSliderThumbColor: '#fff',
    gray: '#808080',
    green: '#3CB34F',
    iconLockedColor: '#000',
    iconUnlockedColor: '#C4C4C4',
    inactiveTabBackgroundColor: '#f9f9f9',
    lightGray: '#B9B9B9',
    logoColor: '#0029FF',
    logoTextColor: '#000',
    marketsSearchFieldBackgroundColor: '#eaeaea',
    marketsSearchFieldBorderColor: '#dedede',
    marketsSearchFieldTextColor: '#333',
    notificationActive: '#F8F8F8',
    notificationIconColor: '#474747',
    notificationsBadgeColor: '#ff6534',
    numberDecimalsColor: '#dedede',
    orange: '#F6851B',
    rowActive: '#FBFDFF',
    stepsProgressCheckMarkColor: '#fff',
    stepsProgressStartingDotColor: '#000',
    stepsProgressStepLineColor: 'rgba(0, 0, 0, 0.1)',
    stepsProgressStepLineProgressColor: '#000',
    stepsProgressStepTitleColor: '#e6e6e6',
    stepsProgressStepTitleColorActive: '#000',
    tableBorderColor: '#dedede',
    tdColor: '#000',
    textColorCommon: '#000',
    textDark: '#666',
    textInputBackgroundColor: '#F9F9F9',
    textInputBorderColor: '#dedede',
    textInputTextColor: '#000',
    textLight: '#999',
    textLighter: '#666',
    thColor: '#B9B9B9',
    topbarBackgroundColor: '#fff',
    topbarBorderColor: '#dedede',
    topbarSeparatorColor: '#dedede',
};

export class DefaultTheme implements Theme {
    public componentsTheme: ThemeProperties;
    public modalTheme: ThemeModalStyle;
    constructor() {
        this.componentsTheme = whiteThemeColors;
        this.modalTheme = modalThemeStyle;
    }
}
