// For simplicity we % encode EVERY byte. For testing purposes we dont care that 'A' => '%41'
export const urlEncodeBuffer = (data: Buffer): string => {
    let encoded = '';

    for (let i = 0; i < data.length; i++){
        encoded += `%${data.subarray(i, i+1).toString('hex').toLocaleUpperCase()}`
    }

    return encoded;
}