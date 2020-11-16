export const TaskProgressStatus = {
    TODO: { name: "Todo", color: "amber" },
    IN_PROGRESS: { name: "In progress", color: "lime" },
    BLOCKED: { name: "Blocked", color: "purple", dark: true },
    DONE: { name: "Done", color: "teal", dark: true },
};

export const TaskTimeStatus = {
    OVERDUE: { name: "Overdue", color: "red darken-2", dark: true },
    EXPIRED: { name: "Expired", color: "blue-grey", dark: true },
};

export const ContainerEntries = [
    { name: "Notebook", children_type: "Note", child_attr: "notes", },
    { name: "Project", children_type: "Task", child_attr: "tasks", },
    { name: "Saga", children_type: "Event", child_attr: "events", },
];

export const PriorityLevels = [
    1,
    2,
    3,
    4,
    5
]

export const EffortEstimateDefaultValues = [
    0.5,
    1,
    2,
    3,
    4,
    5,
    10,
    20
]
