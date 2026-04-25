import { SVGProps } from 'react'

export type IconSvgProps = SVGProps<SVGSVGElement> & {
    size?: number
}

export const Logo: React.FC<IconSvgProps> = ({ size = 18, width, height, ...props }) => (
    <svg
        width={width || size}
        height={height || size}
        viewBox="0 0 1029 1025"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        {/* <path fill='currentColor' d="M12 4 6 17.5l6-3 6 3zm0 9.5a1 1 0 0 0-.447.105L8.046 15.36 12 6.462l3.954 8.897-3.507-1.754A1 1 0 0 0 12 13.5m0-12.3A10.8 10.8 0 1 0 22.8 12 10.81 10.81 0 0 0 12 1.2m0 20.6a9.8 9.8 0 1 1 9.8-9.8 9.81 9.81 0 0 1-9.8 9.8" />
        <path fill="none" d="M0 0h24v24H0z" /> */}

        <path d="M514.5 1023H1025.5L514.5 1V1023Z" fill="#071311" />
        <path d="M514.5 1023H1025.5L514.5 1V1023Z" fill="#071311" />
        <path d="M514.5 1023H1025.5L514.5 1V1023Z" fill="#071311" />
        <path d="M514.5 1023H1025.5L514.5 1V1023Z" fill="#071311" />
        <path d="M514.5 1023H1025.5L514.5 1V1023Z" fill="#071311" />
        <path d="M514.5 1023H1025.5L514.5 1V1023Z" fill="#071311" />
        <path d="M514.5 1023H1025.5L514.5 1V1023Z" fill="#071311" />
        <path d="M514.5 1023H1025.5L514.5 1V1023Z" fill="#071311" />
        <path d="M514.5 1023H1025.5L514.5 1V1023Z" fill="#071311" />
        <path d="M514.5 1023H1025.5L514.5 1V1023Z" fill="#071311" />
        <path d="M514.5 1023H1025.5L514.5 1V1023Z" fill="#071311" />
        <path d="M514.5 1023H1025.5L514.5 1V1023Z" fill="#071311" />
        <path d="M514.5 1023H1025.5L514.5 1V1023Z" fill="#071311" />
        <path d="M514.5 1023H1025.5L514.5 1V1023Z" fill="#071311" />
        <path d="M514.5 1023H1025.5L514.5 1V1023Z" fill="#071311" />
        <path d="M514.5 1023H1025.5L514.5 1V1023Z" fill="#071311" />
        <path d="M514.5 1024.5H5L514.5 1V1024.5Z" fill="#071311" />
        <path d="M514.5 1024.5H5L514.5 1V1024.5Z" fill="#071311" />
        <path d="M514.5 1024.5H5L514.5 1V1024.5Z" fill="#071311" />
        <path d="M514.5 1024.5H5L514.5 1V1024.5Z" fill="#071311" />
        <path d="M514.5 1024.5H5L514.5 1V1024.5Z" fill="#071311" />
        <path d="M514.5 1024.5H5L514.5 1V1024.5Z" fill="#071311" />
        <path d="M514.5 1024.5H5L514.5 1V1024.5Z" fill="#071311" />
        <path d="M514.5 1024.5H5L514.5 1V1024.5Z" fill="#071311" />
        <path d="M514.5 1024.5H5L514.5 1V1024.5Z" fill="#071311" />
        <path d="M514.5 1024.5H5L514.5 1V1024.5Z" fill="#071311" />
        <path d="M514.5 1024.5H5L514.5 1V1024.5Z" fill="#071311" />
        <path d="M514.5 1024.5H5L514.5 1V1024.5Z" fill="#071311" />
        <path d="M514.5 1024.5H5L514.5 1V1024.5Z" fill="#071311" />
        <path d="M514.5 1024.5H5L514.5 1V1024.5Z" fill="#071311" />
        <path d="M514.5 1024.5H5L514.5 1V1024.5Z" fill="#071311" />
        <path d="M514.5 1024.5H5L514.5 1V1024.5Z" fill="#071311" />
        <path d="M381 486.5L701 374L382.5 266L381 486.5Z" fill="url(#paint0_linear_12_41)" />
        <path d="M701 374V693L255 522L701 374Z" fill="url(#paint1_linear_12_41)" />
        <path d="M255 522L879.5 730.5L255 979V522Z" fill="url(#paint2_linear_12_41)" />
        <path d="M4.5 1024L879.5 730.5L881.5 1024H4.5Z" fill="url(#paint3_linear_12_41)" />
        <defs>
            <linearGradient id="paint0_linear_12_41" x1="701" y1="376" x2="381" y2="376" gradientUnits="userSpaceOnUse">
                <stop stopColor="#01FDFF" />
                <stop offset="1" stopColor="#62FFCE" />
            </linearGradient>
            <linearGradient id="paint1_linear_12_41" x1="255" y1="519.5" x2="701" y2="534" gradientUnits="userSpaceOnUse">
                <stop stopColor="#22C1F3" />
                <stop offset="1" stopColor="#01FDFF" />
            </linearGradient>
            <linearGradient id="paint2_linear_12_41" x1="879" y1="522" x2="255" y2="522" gradientUnits="userSpaceOnUse">
                <stop stopColor="#477BE0" />
                <stop offset="1" stopColor="#23C1F0" />
            </linearGradient>
            <linearGradient id="paint3_linear_12_41" x1="4" y1="1024" x2="881" y2="1024" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6537C6" />
                <stop offset="1" stopColor="#3D73CB" />
            </linearGradient>
        </defs>
    </svg>

)