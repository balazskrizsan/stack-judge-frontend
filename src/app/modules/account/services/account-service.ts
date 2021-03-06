import {Injectable} from '@angular/core';
import {AccountRepository} from '../repositories/account-repository';
import {AccountState} from '../states/account-state';
import {IJwt} from '../interfaces/i-jwt';
import {ICurrentUser} from '../interfaces/i-current-user';
import {Observable} from 'rxjs';
import {IResponseEntity} from '../../../interfaces/i-response-entity';
import {IUser} from '../interfaces/i-user';

@Injectable()
export class AccountService {
  private static readonly jwtUserIdIndex = 0;
  private static readonly jwtUsernameIndex = 1;
  private static readonly jwtProfilePictureUrlIndex = 2;

  public constructor(
    private accountRepository: AccountRepository,
    private accountState: AccountState
  ) {
  }

  public getStateAsObservable$(): Observable<ICurrentUser | null> {
    return this.accountState.getAsObservable$();
  }

  public getJwt(): string {
    return this.accountRepository.getJwt();
  }

  public storeJwt(token: string): void {
    this.accountRepository.storeJwt(token);
    this.updateState(token);
  }

  public refresh(): void {
    this.updateState(this.accountRepository.getJwt());
  }

  private updateState(token: string): void {
    const parsedJwt: IJwt = this.parseJwt(token);

    if (null === parsedJwt) {
      this.accountState.setState(null);
      // @todo: display error

      return;
    }

    this.accountState.setState({
      userId: parsedJwt.sub ? this.getUserIdFromJwtSub(parsedJwt.sub) : 0,
      username: parsedJwt.sub ? this.getUsernameFromJwtSub(parsedJwt.sub) : '',
      profilePictureUrl: parsedJwt.sub ? this.getProfilePictureUrlFromJwtSub(parsedJwt.sub) : '',
      jwt: token,
      parsedJwt
    });
  }

  private parseJwt(token: string): IJwt {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = JSON.parse(
        decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
      );

      jsonPayload.sub = jsonPayload.sub.split(',');

      return jsonPayload;
    } catch (e) {
      console.error('JWT decompile error:', e.message);

      return null;
    }
  }

  private getUserIdFromJwtSub(sub: Array<string>): number {
    return Number(sub[AccountService.jwtUserIdIndex]);
  }

  private getUsernameFromJwtSub(sub: Array<string>): string {
    return sub[AccountService.jwtUsernameIndex];
  }

  private getProfilePictureUrlFromJwtSub(sub: Array<string>): string {
    return sub[AccountService.jwtProfilePictureUrlIndex];
  }

  public isLoggedIn(): Promise<boolean> {
    return new Promise<boolean>(
      resolve => this.accountState
        .getAsObservable$()
        .subscribe((user: ICurrentUser) => user ? resolve(true) : resolve(false))
    );
  }

  public getUsername(): Promise<string> {
    return new Promise<string>(
      resolve => this.accountState
        .getAsObservable$()
        .subscribe((user: ICurrentUser) => user.username ? resolve(user.username) : resolve(''))
      // @todo: error handling
    );
  }

  public getUserId(): Promise<number> {
    return new Promise<number>(
      resolve => this.accountState
        .getAsObservable$()
        .subscribe((user: ICurrentUser) => user.userId ? resolve(Number(user.userId)) : resolve(0))
      // @todo: error handling
    );
  }

  public logout(): void {
    this.accountRepository.removeJwt();
    this.accountState.setState(null);
  }

  public getUserByReviewId(reviewId: number): Observable<IResponseEntity<IUser>> {
    return this.accountRepository.getByReviewId(reviewId);
  }
}
