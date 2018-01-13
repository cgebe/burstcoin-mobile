/*
* Copyright 2018 PoC-Consortium
*/

import { Component, OnInit, NgModule } from "@angular/core";
import { ModalDialogParams } from "nativescript-angular/modal-dialog";
import { Page } from "ui/page";
import { ListPicker } from "ui/list-picker";
import { DatabaseService } from "../../../../lib/services";

@Component({
    moduleId: module.id,
    templateUrl: "./language.component.html",
})
export class LanguageComponent implements OnInit {
    private languageNames: string[] = ["Deutsch", "Ελληνικά", "English", "Español", "Français", "हिन्दी", "Italiano", "한국어", "Magyar", "Nederlands", "Polski", "Pу́сский", "Slovensky", "Svenska", "தமிழ", "中文"]
    private languages: string[] = ["de", "el", "en", "es", "fr", "hi", "it", "ko", "hu", "nl", "pl", "ru", "sk", "sv", "ta", "zh"]
    private picked: string;
    private index: number;

    constructor(
        private databaseService: DatabaseService,
        private params: ModalDialogParams,
        private page: Page
    ) {}

    ngOnInit() {
        this.index = this.languages.indexOf(this.params.context)
        this.page.on("unloaded", () => {
            this.params.closeCallback();
        });
    }

    public selectedIndexChanged(args) {
        let picker = <ListPicker>args.object;
        this.picked = this.languages[picker.selectedIndex];
    }

    public onTapOk() {
        this.params.closeCallback(this.picked);
    }

    public onTapNo() {
        this.params.closeCallback();
    }
}
