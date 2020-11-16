import {server_address, entry_type_to_url_suffix} from "./config";
import {TaskProgressStatus, TaskTimeStatus} from "@/enums";
import moment from "moment";

// import SvgText from 'svg-text';

const axios = require("axios");

export function getSyncMethod(object) {
    // the method to use in order to sync an entry with the back-end
    // TODO implement hard delete ie call axios.delete on the back-end
    if ("url" in object) {
        return async (payload) => {
            // console.log("patching at : " + object.url);
            // console.log(payload);
            return await axios.patch(object.url, payload);
        };
    }
    console.log(
        "posting at :" +
        server_address +
        "/" +
        entry_type_to_url_suffix[(object.hasOwnProperty("resourcetype")) ? object.resourcetype : "Reference"] +
        "/"
    );
    console.log(object);

    function m(payload) {
        return axios.post(
            server_address + "/" + entry_type_to_url_suffix[(object.hasOwnProperty("resourcetype")) ? object.resourcetype : "Reference"] + "/",
            payload
        );
    }

    return m;
}

export function getEntryId(entry) {
    if ("key" in entry) {
        return entry.key;
    }
    return String([entry.creation_date, entry.id, entry.client]);
}

export function getReferenceId(reference) {
    if ("key" in reference) {
        return reference.key;
    }
    return String([reference.source.key, reference.reference_id]);
}

// We massage the objects fetched from the backend, so that the urls they may contain are resolved to actual
// object keys.

export function addEntryKey(entry) {
    return {
        ...entry,
        key: getEntryId(entry)
    }
}


// Graph utilities

export function text_as_SVG(text, svgElement) {

    // // Will render a multiline <text> element into the document's first SVG element.
    // const svgtext = new SvgText({
    //     text: text,
    //     element: svgElement,
    //     maxWidth: 300,
    //     maxLines: 3,
    //     textOverflow: 'ellipsis',
    //     verticalAlign: 'top',
    // });
    //
    // if (text.length > 50) {
    //     console.log(svgtext)
    //     console.log("<svg height=\"350\" width=\"350\">\n" +
    //         "   <rect width=\"350\" height=\"100\" stroke=\"black\" stroke-width=\"6\" fill=\"green\"/>\n" +
    //         svgtext.text.outerHTML +
    //         "  Sorry, your browser does not support inline SVG.\n" +
    //         "</svg>")
    // }
    //
    // return {
    //     text: "<svg height=\"350\" width=\"350\">\n" +
    //         "   <rect width=\"350\" height=\"100\" stroke=\"black\" stroke-width=\"6\" fill=\"green\"/>\n" +
    //         svgtext.text.outerHTML +
    //         "  Sorry, your browser does not support inline SVG.\n" +
    //         "</svg>",
    //     height: svgtext.height,
    //     width: svgtext.width
    // }
}

function task_progress_status (task) {
    return TaskProgressStatus.TODO;
}

function task_time_status (task) {
    if (task.expiration_date) {
        let expiration_date = new moment(task.expiration_date);
        let now = new moment();
        if (expiration_date <= now) {
            return TaskTimeStatus.EXPIRED;
        }
    }
    if (task.due_date) {
        let due_date = new moment(task.due_date);
        let now = new moment();
        if (due_date <= now) {
            return TaskTimeStatus.OVERDUE;
        }
    }
}

export function task_statuses(task) {
    if (task.done) {
        return [ TaskProgressStatus.DONE ]; // Overdue/expired status does not matter if the task is done
    }

    let tstatus = task_time_status(task);
    let pstatus = task_progress_status(task);

    if (!tstatus) {
        return [ pstatus ];
    }

    if (tstatus == TaskTimeStatus.EXPIRED) {
        return [ tstatus ];
    }

    return [ tstatus, task_progress_status(task) ];
}


// Random stuff I miss from python

export function setdefault(object, key, def) {
    if (!object.hasOwnProperty(key)) {
        object[key] = def
    }
    return object[key]
}
