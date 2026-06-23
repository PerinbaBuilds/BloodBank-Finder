export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  RegisterChoice: undefined;
  RegisterDonor: undefined;
  RegisterOrganization: undefined;
};

export type HomeStackParamList = {
  HomeRoot: undefined;
  RequestDetail: { id: string };
  NewRequest: undefined;
  AmbulanceDetail: { id: string };
};

export type RequestsStackParamList = {
  RequestsList: undefined;
  RequestDetail: { id: string };
  NewRequest: undefined;
  AmbulanceDetail: { id: string };
};

export type SearchStackParamList = {
  SearchRoot: undefined;
};

export type NotificationsStackParamList = {
  NotificationsList: undefined;
  RequestDetail: { id: string };
  AmbulanceDetail: { id: string };
};

export type ProfileStackParamList = {
  ProfileRoot: undefined;
  EditDonorProfile: undefined;
  Inventory: undefined;
  AmbulanceDetail: { id: string };
  AmbulanceFleet: undefined;
  DonationHistory: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Requests: undefined;
  Search: undefined;
  Notifications: undefined;
  Profile: undefined;
};
