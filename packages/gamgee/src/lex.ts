/*!
  Copyright (c) 2019 DynAgility LLC. All rights reserved.
  Licensed under the MIT License.
*/

interface CurrentIntent {
  name: string;
  slots: { [name: string]: string };
  slotDetails: {
    [name: string]: {
      resolutions: Array<{ value: string }>;
      originalValue: string;
    }
  };
  confirmationstatus: 'None' | 'Confirmed' | 'Denied';
}

export interface LexEvent {
  currentIntent: CurrentIntent;
  bot: {
    name: string;
    alias: string;
    version: string;
  };
  userId: string;
  intputTranscript: string;
  invocationSource: 'FulfillmentCodeHook' | 'DialogCodeHook';
  outputDialogMode: 'Text' | 'Voice';
  messageVersion: '1.0';
  sessionAttributes: { [key: string]: string };
  requestAttributes: { [key: string]: string };
}

export interface LexResponse<T extends LexDialogAction>{
  sessionAttributes?: { [key: string]: string };
  requestAttributes?: { [key: string]: string };
  dialogAction: T;
}

export interface LexDialogAction {
  type: 'ElicitIntent' | 'ElicitSlot' | 'ConfirmIntent' | 'Delegate' | 'Close';
}

export interface LexCard {
  version: number;
  contentType: "application/vnd.amazonaws.card.generic";
  genericAttachments: Array<LexCardContent>;
}

export interface LexCardContent {
  title: string;
  subtitle: string;
  imageUrl: string;
  attachmentLinkUrl: string;
  buttons: Array<{ text: string, value: string}>;
}

interface LexMessage {
  contentType: 'PlainText' | 'SSML' | 'CustomPayload';
  content: string;
}

export interface LexClose extends LexDialogAction {
  type: 'Close';
  fulfillmentState: 'Fulfilled' | 'Failed';
  message?: LexMessage;
  responeCard?: LexCard;
}

export interface LexConfirmIntent extends LexDialogAction {
  type: 'ConfirmIntent';
  intentName: string;
  slots: { [name: string]: string };
  message?: LexMessage;
  responseCard: LexCard;
}

export interface LexDelegate extends LexDialogAction {
  type: 'Delegate';
  slots:  { [name: string]: string };
}

export interface LexElicitIntent extends LexDialogAction {
  type: 'ElicitIntent';
  message?: LexMessage;
  responseCard?: LexCard;
}

export interface LexElicitSlot extends LexDialogAction { 
  type: 'ElicitSlot';
  intentName: string;
  slots: { [name: string]: string };
  slotToElicit: string;
  message?: LexMessage;
  responseCard?: LexCard;
}``