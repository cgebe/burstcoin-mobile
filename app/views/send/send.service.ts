
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { Account, Attachment, BurstAddress, Transaction } from "../../lib/model";
import { AccountService, CryptoService } from "../../lib/services";

@Injectable()
export class SendService {

    private amount: number;
    private fee: number;
    private recipient: string;

    private messageEnabled: boolean;
    private message: string;
    private messageEncrypted: boolean;

    public constructor(
        private accountService: AccountService,
        private cryptoService: CryptoService
    ) {
        this.reset()
    }

    public reset() {
        this.recipient = "";
        this.amount = 0;
        this.fee = 1;

        this.message = ""
        this.messageEnabled = false;
        this.messageEncrypted = true;
    }

    public setRecipient(recipient: string) {
        this.recipient = recipient;
    }

    public getRecipient(): string {
        return this.recipient
    }

    public setFee(fee: number) {
        this.fee = fee;
    }

    public getFee(): number {
        return this.fee;
    }

    public setAmount(amount: number) {
        this.amount = amount;
    }

    public getAmount(): number {
        return this.amount;
    }

    public getTotal(): number {
        return this.amount + this.fee;
    }

    public setMessageEnabled(enabled: boolean) {
        this.messageEnabled = enabled;
    }

    public getMessageEnabled(): boolean {
        return this.messageEnabled;
    }

    public setMessage(message: string) {
        this.message = message;
    }

    public getMessage(): string {
        return this.message;
    }

    public setMessageEncrypted(encrypted: boolean) {
        this.messageEncrypted = encrypted;
    }

    public getMessageEncrypted(): boolean {
        return this.messageEncrypted;
    }

    public createTransaction(publicKey: string, privateKey:string , pin: string): Promise<Transaction> {
        return new Promise((resolve, reject) => {
            let transaction = new Transaction()
            transaction.recipientAddress = this.recipient;
            transaction.senderPublicKey = this.accountService.currentAccount.value.keypair.publicKey;
            transaction.amountNQT = this.amount;
            transaction.feeNQT = this.fee;
            if (this.messageEnabled) {
                transaction.attachment = new Attachment();
                if (this.messageEncrypted) {
                    transaction.attachment.messageIsEncrypted = this.messageEncrypted
                    this.cryptoService.encryptNote(this.message, publicKey, privateKey, this.accountService.hashPinEncryption(pin)).then(encrypted => {
                        transaction.attachment.message = encrypted.message;
                        transaction.attachment.nonce = encrypted.nonce;
                    })
                } else {
                    transaction.attachment.message = this.message;
                    resolve(transaction);
                }
            } else {
                resolve(transaction);
            }
        });

    }

}