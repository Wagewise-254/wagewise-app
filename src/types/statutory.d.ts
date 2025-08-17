export type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
  pays_paye: boolean;
  pays_nssf: boolean;
  pays_helb: boolean;
  pays_housing_levy: boolean;
};

export type UpdateStatutoryPayload = {
  pays_paye: boolean;
  pays_nssf: boolean;
  pays_housing_levy: boolean;
};