function getNestedValue(obj, path) {
    return path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj)
}

export function renderTemplate(template, data) {
    // Handle {{#each path}}...{{/each}} blocks
    let result = template.replace(
        /\{\{#each\s+(\S+?)\}\}([\s\S]*?)\{\{\/each\}\}/g,
        (match, path, inner) => {
            const arr = getNestedValue(data, path)
            if (!Array.isArray(arr)) return ''
            return arr
                .map((item, index) => {
                    return renderTemplate(inner, {
                        ...data,
                        this: item,
                        '@index': index,
                        '@number': index + 1,
                    })
                })
                .join('')
        },
    )

    // Handle {{variable}} placeholders
    result = result.replace(/\{\{(\S+?)\}\}/g, (match, path) => {
        const val = getNestedValue(data, path)
        return val !== undefined && val !== null ? String(val) : ''
    })

    return result
}
