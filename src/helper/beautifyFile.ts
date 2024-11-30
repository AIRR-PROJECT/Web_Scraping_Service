import { js as js_beautify } from 'js-beautify';
const beautifyJSON = (json: string) => {
    let temp = json.replace(/(\r\n|\n|\r)/gm, "");
    temp = js_beautify(temp, { indent_size: 4, preserve_newlines: false });
    return temp;
}

const beautifyHelper = {
    beautifyJSON: beautifyJSON
}

export default beautifyHelper;
