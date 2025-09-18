
type noteRequirementConditionType = "{{severity_level}}>50" | "{{severity_level}}<50";
type picRequirementConditionType = "{{severity_level}}>50" | "{{severity_level}}<50";

interface ConditionOption {
  label: "Yes" | "No";
  severity_level: number;
}

export interface InspectionJson {
  jsonrpc: number;
  id: number;
  result: Result
}

interface Result {
  name: string;
  inspector: string;
  inspection_date: string;
  signature_required: "Yes" | "No";
  id: number;
  lines: Line[];
}

export interface Line {
  id: number;
  state: string;
  name: string;
  inspection_id: number;
  note: string;
  inspection_type_line_id: number;
  is_note_required: boolean;
  is_pic_required: boolean;
  is_conditional_expression: boolean;
  lock_row: boolean;
  inspection_component_id: number;
  inspection_condition_id: number;
  num_pics: number;
  note_requirement: string;
  pic_requirement: string;
  note_requirement_condition: noteRequirementConditionType;
  pic_requirement_condition: picRequirementConditionType;
  pic_handling: string;
  conditional_expression: string;
  sequence: number;
  picture_url: string;
  condition: boolean;
  condition_label: string;
  condition_options: ConditionOption[];
  field_requirement: string;
}
