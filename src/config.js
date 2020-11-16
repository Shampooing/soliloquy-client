export var server_address = "http://127.0.0.1:8000";

export var entry_type_to_url_suffix = {
    Note: "notes",
    Notebook: "notebooks",
    Event: "events",
    Saga: "sagas",
    Task: "tasks",
    Project: "projects",
    Reference: "references",
};

export var this_client_id = 1;

export var colors_of_entry_types = {
    Note: 'blue accent-1',
    Notebook: 'blue accent-2',
    Event: 'lime lighten-3',
    Saga: 'lime lighten-1',
    Task: 'orange lighten-3',
    Project: 'orange lighten-1',
};
