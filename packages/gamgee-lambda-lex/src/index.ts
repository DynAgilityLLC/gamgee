/*!
  Copyright (c) 2019 DynAgility LLC. All rights reserved.
  Licensed under the MIT License.
*/

import { LexEvent, LexResponse, LexCardContent, LexDialogAction, LexDelegate, LexClose, LexElicitSlot } from 'gamgee';

interface LexResponseGenerator<T extends LexDialogAction> {
  toLexResponse: (...args) => LexResponse<T>;
}

export abstract class ResponseContent implements LexResponseGenerator<any> {
  protected message?: string | Object;
  protected contentType: 'PlainText' | 'SSML' | 'CustomPayload';
  protected card?: LexCardContent;
  constructor(message?: string | Object, card?, contentType = 'PlainText') {
    this.message = message;
    if (typeof message !== 'string') {
      this.contentType = 'CustomPayload';
    }
    this.card = card;
  }
  public abstract toLexResponse(sessionAttributes, requestAttributes): LexResponse<any>;
} 

export class InvalidSlotValueResponse extends ResponseContent {
  private intentName: string;
  private slots: { [key: string]: string }
  private invalidSlotName: string;
  constructor(intentName: string, slots: { [key: string]: string }, invalidSlotName: string, message: string | Object, card?, contentType = 'PlainText') {
    super(message, card, contentType);
    this.intentName = intentName;
    this.slots = slots;
    this.slots[invalidSlotName] = undefined;
    this.invalidSlotName = invalidSlotName;
  }
  public toLexResponse(sessionAttributes, requestAttributes): LexResponse<LexElicitSlot> {
    const response: LexResponse<LexElicitSlot> = {
      sessionAttributes,
      requestAttributes,
      dialogAction: {
        type: 'ElicitSlot',
        intentName: this.intentName,
        slots: this.slots,
        slotToElicit: this.invalidSlotName,
        responseCard: {
          version: 1,
          contentType: 'application/vnd.amazonaws.card.generic',
          genericAttachments: [this.card]
        }
      }
    };
    if (this.message) {
      response['message'] = {
        content: (typeof this.message !== 'string'?JSON.stringify(this.message):this.message),
        contentType: this.contentType,
      }
    }
    return response;
  }
}

export abstract class LexLambda {
  public abstract async validate(event: LexEvent, context: any): Promise<ResponseContent | undefined>;
  public abstract async fulfill(event: LexEvent, context: any): Promise<ResponseContent | undefined>;
  public delegate(sessionAttributes, requestAttributes, slots): LexResponse<LexDelegate> {
    return {
      sessionAttributes,
      requestAttributes,
      dialogAction: {
        type: 'Delegate',
        slots
      }
    }
  }
  public close(sessionAttributes, requestAttributes, success: boolean): LexResponse<LexClose> {
    return {
      sessionAttributes,
      requestAttributes,
      dialogAction: {
        type: 'Close',
        fulfillmentState: (success?'Fulfilled':'Failed')
      }
    };
  }
  public async run(event: LexEvent, context: any) {
    const { sessionAttributes, requestAttributes, currentIntent } = event;
    if (event.invocationSource === 'FulfillmentCodeHook') {
      try {
        const responseContent = (await this.fulfill(event, context));
        if (responseContent !== undefined) {
          return responseContent.toLexResponse(sessionAttributes, requestAttributes);
        } else {
          return this.close(sessionAttributes, requestAttributes, true);
        }
      } catch {
        return this.close(sessionAttributes, requestAttributes, false);
      }
    }
    else if (event.invocationSource === 'DialogCodeHook') {
      const responseContent = (await this.validate(event, context));
      if (responseContent !== undefined) {
        return responseContent.toLexResponse(sessionAttributes, requestAttributes);
      }
    }
    return this.delegate(sessionAttributes, requestAttributes, currentIntent.slots);
  }
}

type SlotValidators = { [slotName: string]: (value: string) => Promise<InvalidSlotValueResponse | undefined> };

export abstract class ValidatorLamda extends LexLambda {
  private validators: SlotValidators;
  constructor(validators: SlotValidators) {
    super();
    this.validators = validators;
  }
  public async fulfill(event: LexEvent, context: any): Promise<ResponseContent | undefined> {
    throw new TypeError('Not Implemented. ValidatorLambda cannot be used for Fulfillment.');
  }
  public async validate(event: LexEvent, context: any): Promise<ResponseContent | undefined> {
    const { sessionAttributes, requestAttributes, currentIntent } = event;
    let slotName;
    let validateResult;
    for (slotName in currentIntent.slots) {
      if (this.validators[slotName] === undefined) continue;
      validateResult = this.validators[slotName][currentIntent.slots[slotName]];
      if (validateResult) {
        break;
      }
    }
    return validateResult;
  }
}