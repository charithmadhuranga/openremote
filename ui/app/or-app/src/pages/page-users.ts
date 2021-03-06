import {
  css,
  customElement,
  html,
  property,
  PropertyValues,
  TemplateResult,
  unsafeCSS,
} from "lit-element";
import manager, { OREvent } from "@openremote/core";
import "@openremote/or-panel";
import "@openremote/or-translate";
import { EnhancedStore } from "@reduxjs/toolkit";
import { AppStateKeyed } from "../app";
import { Page } from "../types";
import { ClientRole, Role, User } from "@openremote/model";
import { i18next } from "@openremote/or-translate";
import { OrIcon } from "@openremote/or-icon";
import { InputType, OrInputChangedEvent } from "@openremote/or-input";
import {showOkCancelDialog} from "@openremote/or-mwc-components/dist/or-mwc-dialog";

const tableStyle = require("@material/data-table/dist/mdc.data-table.css");

export function pageUsersProvider<S extends AppStateKeyed>(
  store: EnhancedStore<S>
) {
  return {
    routes: ["users"],
    pageCreator: () => {
      return new PageUsers(store);
    },
  };
}

@customElement("page-users")
class PageUsers<S extends AppStateKeyed> extends Page<S> {
  static get styles() {
    // language=CSS
    return [
      unsafeCSS(tableStyle),
      css`
        #wrapper {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          overflow: auto;
        }

        #title {
          margin: 0 auto;
          padding: 20px;
          font-size: 18px;
          font-weight: bold;
          width: calc(100% - 40px);
          max-width: 1400px;
        }

        #title or-icon {
          margin-right: 10px;
        }

        .panel {
          width: calc(100% - 80px);
          max-width: 1400px;
          background-color: white;
          border: 1px solid #e5e5e5;
          border-radius: 5px;
          position: relative;
          margin: 0 auto;
          padding: 20px;
        }

        .panel-title {
            text-transform: uppercase;
            font-weight: bolder;
            line-height: 1em;
            color: var(--internal-or-asset-viewer-title-text-color);
            margin-bottom: 20px;
            flex: 0 0 auto;
            letter-spacing: 0.025em;
        }

        #table-users {
            width: 100%;
        }

        .meta-item-container {
          flex-direction: row;
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.25s ease-out;
          padding: 0 20px 0 30px;
        }

        or-input {
            margin-bottom: 20px;
            margin-right: 20px;
        }

        or-icon {
            vertical-align: middle;
            --or-icon-width: 20px;
            --or-icon-height: 20px;
        }

        .row {
            display: flex;
            flex-direction: row;
            margin: 10px 0;
            flex: 1 1 0;
        }

        .column {
            display: flex;
            flex-direction: column;
            margin: 0px;
            flex: 1 1 0;
            
        }

        .mdc-data-table__header-cell {
          font-weight: bold;
        }
        
        .attribute-meta-row td {
          padding: 0;
        }

        .attribute-meta-row.expanded .meta-item-container {
          max-height: 1000px;
          transition: max-height 1s ease-in;
        }
        
        .button {
          cursor: pointer;
          display: flex;
          flex-direction: row;
          align-content: center;
          margin: 10px 15px;
          align-items: center;
        }

        .button or-icon {
          --or-icon-fill: var(--or-app-color4);
        }

        @media screen and (max-width: 769px){
          .row {
            display: block;
            flex-direction: column;
          }

          .panel {
            border-radius: 0;
          }
        }
      `,
    ];
  }

  @property()
  protected _users: User[] = [];

  @property()
  protected _compositeRoles: Role[] = [];

  @property()
  protected _userRoleMapper = {};
  
  @property()
  public validPassword?: boolean = true;

  @property()
  public realm?: string;

  get name(): string {
    return "users";
  }

  constructor(store: EnhancedStore<S>) {
    super(store);
    this.getUsers();
  }

    protected _onManagerEvent = (event: OREvent) => {
      switch (event) {
          case OREvent.DISPLAY_REALM_CHANGED:
              this.realm = manager.displayRealm;
              break;
      }
  };

  public shouldUpdate(_changedProperties: PropertyValues): boolean {

      if (_changedProperties.has("realm")) {
          this.getUsers();
      }

      return super.shouldUpdate(_changedProperties);
  }

  public connectedCallback() {
      super.connectedCallback();
      manager.addListener(this._onManagerEvent);
  }

  public disconnectedCallback() {
      super.disconnectedCallback();
      manager.removeListener(this._onManagerEvent);
  }


  private getUsers() {
    manager.rest.api.UserResource.getRoles(manager.displayRealm).then(roleResponse => {
      this._compositeRoles = [...roleResponse.data.filter(role => role.composite)];
    })
    manager.rest.api.UserResource.getAll(manager.displayRealm).then(
      (usersResponse) => {
        this._users = [...usersResponse.data];
        this._users.map(user => {
          manager.rest.api.UserResource.getUserRoles(manager.displayRealm, user.id).then(userRoleResponse => {
              this._userRoleMapper[user.id] = userRoleResponse.data.find(r => r.composite && r.assigned);
              this.requestUpdate()
          })
        })
        
      }
    );
  }

  private _createUser(user, passwords, role) {
  manager.rest.api.UserResource.create(manager.displayRealm, user).then((response:any) => {
    if(passwords && passwords.resetPassword && passwords.repeatPassword) {
      if(passwords.resetPassword !== passwords.repeatPassword) {
        this.validPassword = false; 
        return;
      }
      const credentials = {value: passwords.resetPassword}
      const id = response.data.id;
      manager.rest.api.UserResource.resetPassword(manager.displayRealm, id, credentials);
      if(role) {
        this._updateRole(response.data, role);
      } else {
          this.getUsers()
      }
    }
  });
    
  }

  private _updateRole(user, value) {
    if(this._compositeRoles.length === 0) return
    const role = this._compositeRoles.find(c => c.id === value);
    if(role){
      role['assigned'] = true;
      manager.rest.api.UserResource.updateUserRoles(manager.displayRealm, user.id, [role]).then(response => {
        this.getUsers()
      })
      this._userRoleMapper[user.id] = role;
    }
  }

  private _updateUser(user, passwords, role) {
      if(passwords && passwords.resetPassword && passwords.repeatPassword) {
          if(passwords.resetPassword !== passwords.repeatPassword) {
            this.validPassword = false; 
            return;
          };
          const credentials = {value: passwords.resetPassword}
          manager.rest.api.UserResource.resetPassword(manager.displayRealm, user.id, credentials);
      }
      if(role) {
        this._updateRole(user, role)
      }
    manager.rest.api.UserResource.update(manager.displayRealm, user.id, user);
  }

  private _deleteUser(user) {
    showOkCancelDialog(i18next.t("delete"), i18next.t("deleteUserConfirm"))
    .then((ok) => {
        if (ok) {
          this.doDelete(user);
        }
    });
  }
  
  private doDelete(user) {
    manager.rest.api.UserResource.delete(manager.displayRealm, user.id).then(response => {
      this._users = [...this._users.filter(u => u.id != user.id)]
    })
  }

  protected render(): TemplateResult | void {
    if (!manager.authenticated) {
      return html`
        <or-translate value="notAuthenticated"></or-translate>
      `;
    }

    if (!manager.isKeycloak()) {
      return html`
        <or-translate value="notSupported"></or-translate>
      `;
    }
    const expanderToggle = (ev: MouseEvent, index:number) => {
      const metaRow = this.shadowRoot.getElementById('attribute-meta-row-'+index)
      const expanderIcon = this.shadowRoot.getElementById('mdc-data-table-icon-'+index) as OrIcon
      if(metaRow.classList.contains('expanded')){
        metaRow.classList.remove("expanded");
        expanderIcon.icon = "chevron-right";
      } else {
        metaRow.classList.add("expanded");
        expanderIcon.icon = "chevron-down";
      }
    };
    const selectOptions = this._compositeRoles.map(role => {
      return [role.id, role.name]
    })
    const readonly = !manager.hasRole(ClientRole.WRITE_USER);
    return html`
         <div id="wrapper">
                <div id="title">
                <or-icon icon="account-group"></or-icon>${i18next.t(
                  "user_plural"
                )}
                </div>
                <div class="panel">
                <p class="panel-title">${i18next.t("user_plural")}</p>
                  <div id="table-users" class="mdc-data-table">
                  <table class="mdc-data-table__table" aria-label="attribute list" >
                      <thead>
                          <tr class="mdc-data-table__header-row">
                              <th class="mdc-data-table__header-cell" role="columnheader" scope="col"><or-translate value="username"></or-translate></th>
                              <th class="mdc-data-table__header-cell" role="columnheader" scope="col"><or-translate value="email"></or-translate></th>
                              <th class="mdc-data-table__header-cell" role="columnheader" scope="col"><or-translate value="user_role"></or-translate></th>
                              <th class="mdc-data-table__header-cell" role="columnheader" scope="col"><or-translate value="status"></or-translate></th>
                          </tr>
                      </thead>
                      <tbody class="mdc-data-table__content">
                      ${this._users.map(
                        (user, index) => {
                          let passwords = {resetPassword: "", repeatPassword:""};
                          let role = undefined;
                          const isSameUser = user.username === manager.username;
                          return html`
                          <tr id="mdc-data-table-row-${index}" class="mdc-data-table__row" @click="${(ev) => expanderToggle(ev, index)}">
                            <td
                              class="padded-cell mdc-data-table__cell"
                            >
                              <or-icon id="mdc-data-table-icon-${index}" icon="chevron-right"></or-icon>
                              <span>${user.username}</span>
                            </td>
                            <td class="padded-cell mdc-data-table__cell">
                              ${user.email}
                            </td>
                            <td class="padded-cell mdc-data-table__cell">
                            ${this._userRoleMapper[user.id] ? this._userRoleMapper[user.id].name : null}
                            </td>
                            <td class="padded-cell mdc-data-table__cell">
                              ${user.enabled ? "Active" : "In active"}
                            </td>
                          </tr>
                          <tr id="attribute-meta-row-${index}" class="attribute-meta-row${!user.username ? " expanded" : ""}">
                            <td colspan="4">
                              <div class="meta-item-container">
                                  <div class="row">
                                      <div class="column">
                                          <or-input ?readonly="${readonly}" .label="${i18next.t("user")}" .type="${InputType.TEXT}" min="1" required .value="${user.username}" @or-input-changed="${(e: OrInputChangedEvent) => user.username = e.detail.value}"></or-input>            
                                          <or-input ?readonly="${readonly}" .label="${i18next.t("email")}" .type="${InputType.EMAIL}" min="1" .value="${user.email}" @or-input-changed="${(e: OrInputChangedEvent) => user.email = e.detail.value}"></or-input>            
                                          <or-input ?readonly="${readonly}" .label="${i18next.t("firstName")}" .type="${InputType.TEXT}" min="1" .value="${user.firstName}" @or-input-changed="${(e: OrInputChangedEvent) => user.firstName = e.detail.value}"></or-input>            
                                          <or-input ?readonly="${readonly}" .label="${i18next.t("surname")}" .type="${InputType.TEXT}" min="1" .value="${user.lastName}" @or-input-changed="${(e: OrInputChangedEvent) => user.lastName = e.detail.value}"></or-input>            
                                      </div>

                                      <div class="column">
                                            <or-input  ?readonly="${readonly}"  ?disabled="${isSameUser}" .value="${this._userRoleMapper[user.id] ? this._userRoleMapper[user.id].id : null}" .type="${InputType.SELECT}" .options="${selectOptions}" .label="${i18next.t("role")}" @or-input-changed="${(e: OrInputChangedEvent) => role = e.detail.value}"></or-input>

                                            <or-input ?readonly="${readonly}" .label="${i18next.t("password")}" .type="${InputType.PASSWORD}" min="1"  @or-input-changed="${(e: OrInputChangedEvent) => passwords.resetPassword = e.detail.value}"></or-input>            
                                            <or-input helperText="${this.validPassword ? "" : i18next.t("samePassword")}" helperPersistent ?readonly="${readonly}" .label="${i18next.t("repeatPassword")}" .type="${InputType.PASSWORD}" min="1" @or-input-changed="${(e: OrInputChangedEvent) => {passwords.repeatPassword = e.detail.value; }}"></or-input>   
                                          <or-input  ?readonly="${readonly}" .label="${i18next.t("enabled")}" .type="${InputType.SWITCH}" min="1" required .value="${user.enabled}" @or-input-changed="${(e: OrInputChangedEvent) => user.enabled = e.detail.value}"></or-input>
                                      </div>
                                  </div>

                                  <div class="row">
                                  ${user.id && !readonly ? html`
                                      <or-input .label="${i18next.t("delete")}" .type="${InputType.BUTTON}" @click="${() => this._deleteUser(user)}"></or-input>            
                                      <or-input style="margin-left: auto;" .label="${i18next.t("save")}" .type="${InputType.BUTTON}" @click="${() => this._updateUser(user, passwords, role)}"></or-input>   
                                  ` : html`
                                    <or-input .label="${i18next.t("cancel")}" .type="${InputType.BUTTON}" @click="${() => {this._users.splice(-1,1); this._users = [...this._users]}}"></or-input>            
                                    <or-input style="margin-left: auto;" .label="${i18next.t("save")}" .type="${InputType.BUTTON}" @click="${() => this._createUser(user, passwords, role)}"></or-input>   
                                  `}    
                                  </div>
                              </div>
                            </td>
                          </tr>
                        `
                      })}
                      ${!!this._users[this._users.length -1].id && !readonly ? html`
                        <tr class="mdc-data-table__row">
                          <td colspan="4">
                            <a class="button" @click="${() => this._users = [...this._users, {enabled: true}]}"><or-icon icon="plus"></or-icon><strong>${i18next.t("add")} ${i18next.t("user")}</strong></a> 
                          </td>
                        </tr>
                      ` : ``}
                     
                      </tbody>
                  </table>
                </div>

            </div>
            </div>
           
        `;
  }

  public stateChanged(state: S) {}
}
