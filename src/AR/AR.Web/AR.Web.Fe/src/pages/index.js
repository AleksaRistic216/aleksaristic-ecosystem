import React, { useState } from 'react'
import Grid2 from '@mui/material/Unstable_Grid2'
import { useRouter } from 'next/router'

const Index = () => {
    return (
        <Grid2
            spacing={2}
            container
            justifyContent="center"
            alignItems="center"
            style={{ minHeight: '100vh' }}
        >
            <Grid2>
                <Item scale={4} text={`About`} href={`/explore`} />
            </Grid2>
            <Grid2>
                <Item scale={4} text={`Projects`} href={`/projects`} />
            </Grid2>
            <Grid2>
                <Item scale={4} text={`Blog`} href={`/blog`} />
            </Grid2>
        </Grid2>
    )
}

const Item = ({ scale, text, href }) => {
    const router = useRouter()
    const [hovered, setHovered] = useState(false)
    const size = 64 * scale ?? 1
    const offset = 4 * scale ?? 1
    const fontSize = size / (text.length - 1)
    const hoverColor = '#f33'
    const baseColor = '#FFFFFF'
    const fillColor = '#222'
    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
                transition: 'transform 0.3s, filter 0.3s',
                cursor: 'pointer',
                transform: hovered ? 'scale(1.1) rotate(-5deg)' : 'scale(1)',
                filter: hovered ? `drop-shadow(0 0 10px ${fillColor})` : 'none',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onMouseDown={() => router.push(href)}
        >
            <circle
                cx={size / 2 + offset / 2}
                cy={size / 2 + offset / 2}
                r={size / 2 - offset}
                fill={fillColor}
                stroke="#222"
                strokeWidth="2"
            />
            <text
                x={size / 2 + offset / 2}
                y={size / 2 + offset / 2 + size / (2.5 * text.length)}
                textAnchor="middle"
                fill="#fff"
                fontSize={fontSize}
                fontFamily="Roboto, sans-serif"
                fontWeight="bold"
                style={{
                    transition: 'fill 0.3s',
                    fill: hovered ? hoverColor : baseColor,
                }}
                pointerEvents={`none`}
            >
                {text}
            </text>
        </svg>
    )
}

export default Index
