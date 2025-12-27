import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Account {
    id: string;
    code: string;
    name: string;
    type: string;
    parentId?: string;
    isActive: boolean;
    children?: Account[];
}

export interface JournalEntry {
    id: string;
    entryNumber: number;
    entryDate: string;
    description: string;
    status: string;
    lines: JournalLine[];
    totalDebit: number;
    totalCredit: number;
}

export interface JournalLine {
    accountId: string;
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    description?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AccountingService {
    private baseUrl = `${environment.apiUrl}/api/accounting`;

    constructor(private http: HttpClient) { }

    // Accounts
    getAccounts(): Observable<Account[]> {
        return this.http.get<Account[]>(`${this.baseUrl}/accounts`);
    }

    getAccountsTree(): Observable<Account[]> {
        return this.http.get<Account[]>(`${this.baseUrl}/accounts/tree`);
    }

    createAccount(account: Partial<Account>): Observable<Account> {
        return this.http.post<Account>(`${this.baseUrl}/accounts`, account);
    }

    // Journal Entries
    getJournalEntries(page = 0, size = 20): Observable<JournalEntry[]> {
        return this.http.get<JournalEntry[]>(`${this.baseUrl}/journal?page=${page}&size=${size}`);
    }

    createJournalEntry(entry: Partial<JournalEntry>): Observable<JournalEntry> {
        return this.http.post<JournalEntry>(`${this.baseUrl}/journal`, entry);
    }

    postJournalEntry(id: string): Observable<JournalEntry> {
        return this.http.post<JournalEntry>(`${this.baseUrl}/journal/${id}/post`, {});
    }
}
