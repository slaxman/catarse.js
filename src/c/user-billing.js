import m from 'mithril';
import models from '../models';
import postgrest from 'mithril-postgrest';
import _ from 'underscore';
import h from '../h';
import userVM from '../vms/user-vm';
import inlineError from './inline-error';
import popNotification from './pop-notification';

const userBilling = {
    controller(args) {
        const user = args.user,
              bankAccount = m.prop({}),
              user_id = args.userId,
              error = m.prop(''),
              bankInput = m.prop(''),
              bankCode = m.prop('-1'),
              loader = m.prop(true),
              banks = m.prop(),
              banksLoader = postgrest.loader(models.bank.getPageOptions()),
              showSuccess = m.prop(false),
              showOtherBanks = h.toggleProp(false, true),
              showOtherBanksInput = m.prop(false),
              showError = m.prop(false);

        userVM.getUserBankAccount(user_id).then(data => bankAccount(_.first(data)));
        banksLoader.load().then(banks);

        return {
            bankAccount: bankAccount,
            bankInput: bankInput,
            banks: banks,
            showOtherBanks: showOtherBanks,
            showOtherBanksInput: showOtherBanksInput,
            loader: loader,
            bankCode: bankCode,
            showSuccess: showSuccess,
            showError: showError,
            user: user,
            error: error
        };
    },
    view(ctrl, args) {
        let user = args.user,
            bankAccount = ctrl.bankAccount();

        return m('[id=\'billing-tab\']', [
    m(".w-row", 
        m(".w-col.w-col-10.w-col-push-1",
            [
m(".w-form.card.card-terciary.u-marginbottom-20",
    [
        m(".fontsize-base.fontweight-semibold", 
            "Cartões de crédito"
        ),
        m(".fontsize-small.u-marginbottom-20",
            [
                "Caso algum projeto que você tenha apoiado ",
                m("b", 
                    "com Cartão de Crédito"
                ),
                " não seja bem-sucedido, nós efetuaremos o reembolso ",
                m("b", 
                    "automaticamente"
                ),
                " no cartão utilizado para efetuar o apoio. "
            ]
        ),
        m(".divider.u-marginbottom-20"),
        m(".w-row.w-hidden-tiny.card",
            [
                m(".w-col.w-col-5.w-col-small-5", 
                    m(".fontsize-small.fontweight-semibold", 
                        "Cartão"
                    )
                ),
                m(".w-col.w-col-5.w-col-small-5", 
                    m(".fontweight-semibold.fontsize-small", 
                        "Operadora"
                    )
                ),
                m(".w-col.w-col-2.w-col-small-2")
            ]
        ),
        m(".w-row.card",
            [
                m(".w-col.w-col-5.w-col-small-5", 
                    m(".fontsize-small.fontweight-semibold",
                        [
                            "XXXX XXXX XXXX",
                            m.trust("&nbsp;"),
                            "1274"
                        ]
                    )
                ),
                m(".w-col.w-col-5.w-col-small-5", 
                    m(".fontsize-small.fontweight-semibold.u-marginbottom-10", 
                        "MASTERCARD"
                    )
                ),
                m(".w-col.w-col-2.w-col-small-2", 
                    m("a.btn.btn-terciary.btn-small[data-confirm='você tem certeza?'][data-method='delete'][href='/pt/users/11-luis-otavio-ribeiro/credit_cards/1691'][rel='nofollow']", 
                        "Remover"
                    )
                )
            ]
        ),
        m(".w-row.card",
            [
                m(".w-col.w-col-5.w-col-small-5", 
                    m(".fontsize-small.fontweight-semibold",
                        [
                            "XXXX XXXX XXXX",
                            m.trust("&nbsp;"),
                            "4444"
                        ]
                    )
                ),
                m(".w-col.w-col-5.w-col-small-5", 
                    m(".fontsize-small.fontweight-semibold.u-marginbottom-10", 
                        "MASTERCARD"
                    )
                ),
                m(".w-col.w-col-2.w-col-small-2", 
                    m("a.btn.btn-terciary.btn-small[data-confirm='você tem certeza?'][data-method='delete'][href='/pt/users/11-luis-otavio-ribeiro/credit_cards/15603'][rel='nofollow']", 
                        "Remover"
                    )
                )
            ]
        )
    ]
),
m(`form.simple_form.refund_bank_account_form[accept-charset='UTF-8'][action='/pt/users/${user.id}'][id='user_billing_form'][method='post'][novalidate='novalidate']`,
    [
        m("input[name='utf8'][type='hidden'][value='✓']"),
        m("input[name='_method'][type='hidden'][value='patch']"),
        m(`input[name='authenticity_token'][type='hidden'][value='${h.authenticityToken()}']`),
        m(".w-form.card.card-terciary",
            [
                m(".fontsize-base.fontweight-semibold", 
                    "Dados bancários"
                ),
                m(".fontsize-small.u-marginbottom-20",
                    [
                        "Caso algum projeto que você tenha apoiado ",
                        m("b", 
                            "com Boleto Bancário"
                        ),
                        " não seja bem-sucedido, nós efetuaremos o reembolso de seu pagamento ",
                        m("b", 
                            "automaticamente"
                        ),
                        " na conta indicada abaixo."
                    ]
                ),
                m(".divider.u-marginbottom-20"),
                m(".w-row",
                    [
                        m(".w-col.w-col-6.w-sub-col",
                            [
                                m("label.text.required.field-label.field-label.fontweight-semibold.force-text-dark[for='user_bank_account_attributes_owner_name']", 
                                    "Nome do titular"
                                ),
                                m(`input.string.required.w-input.text-field.positive[id='user_bank_account_attributes_owner_name'][type='text']`, {value: bankAccount.owner_name, name: 'user[bank_account_attributes][owner_name]'})
                            ]
                        ),
                        m(".w-col.w-col-6",
                            [
                                m("label.text.required.field-label.field-label.fontweight-semibold.force-text-dark[for='user_bank_account_attributes_owner_document']", 
                                    "CPF / CNPJ do titular"
                                ),
                                m("input.string.tel.required.w-input.text-field.positive[data-validate-cpf-cnpj='true'][id='user_bank_account_attributes_owner_document'][type='tel'][validation_text='true']", {value: bankAccount.owner_document, name: 'user[bank_account_attributes][owner_document]'})
                            ]
                        )
                    ]
                ),
                m(".w-row",
                    [
                        m(`.w-col.w-col-6.w-sub-col${ctrl.showOtherBanksInput() ? '.w-hidden' : ''}[id='bank_select']`, 
                            m(".input.select.required.user_bank_account_bank_id",
                                [
                                    m("label.field-label", 
                                        "Banco"
                                    ),
                                    m("select.select.required.w-input.text-field.bank-select.positive[id='user_bank_account_attributes_bank_id']", {
                                      name: 'user[bank_account_attributes][bank_id]', 
                                      onchange: (e) => {
                                        m.withAttr('value', ctrl.bankCode)(e);
                                        ctrl.showOtherBanksInput(ctrl.bankCode() == '0');
                                        }
                                      },
                                        [
                                            m("option[value='']"),
                                            m("option[value='51']", {selected: bankAccount.bank_id == '51'},
                                                "001 . Banco do Brasil S.A."
                                            ),
                                            m("option[value='131']", {selected: bankAccount.bank_id == '131'},
                                                "341 . Itaú Unibanco S.A."
                                            ),
                                            m("option[value='23']", {selected: bankAccount.bank_id == '23'},
                                                "237 . Banco Bradesco S.A."
                                            ),
                                            m("option[value='122']", {selected: bankAccount.bank_id == '122'},
                                                "104 . Caixa Econômica Federal"
                                            ),
                                            m("option[value='104']", {selected: bankAccount.bank_id == '104'},
                                                "033 . Banco Santander  (Brasil)  S.A."
                                            ),
                                            m("option[value='127']", {selected: bankAccount.bank_id == '127'},
                                                "399 . HSBC Bank Brasil S.A. - Banco Múltiplo"
                                            ),
                                            m("option[value='23']", {selected: bankAccount.bank_id == '23'},
                                                "237 . Banco Bradesco S.A."
                                            ),
                                            m("option[value='0']",
                                                "Outro"
                                            )
                                        ]
                                    ),
                                    m(".fontsize-smaller.text-error.u-marginbottom-20.fa.fa-exclamation-triangle.w-hidden[data-error-for='user_bank_account_attributes_bank_id']", 
                                        " Selecione um banco"
                                    )
                                ]
                            )
                        ),
                        (ctrl.showOtherBanksInput() ? 
                        m(".w-col.w-col-6.w-sub-col", 
                            m(".w-row.u-marginbottom-20[id='bank_search']", 
                                m(".w-col.w-col-12",
                                    [
                                        m(".input.string.optional.user_bank_account_input_bank_number",
                                            [
                                                m("label.field-label", 
                                                    "Número do banco (3 números)"
                                                ),
                                                m("input.string.optional.w-input.text-field.bank_account_input_bank_number[id='user_bank_account_attributes_input_bank_number'][maxlength='3'][size='3'][type='text']", {
                                                  name: 'user[bank_account_attributes][input_bank_number]', 
                                                  value: ctrl.bankInput(),
                                                  onchange: m.withAttr('value', ctrl.bankInput) 
                                                }),
                                                m(".fontsize-smaller.text-error.u-marginbottom-20.fa.fa-exclamation-triangle.w-hidden[data-error-for='user_bank_account_attributes_input_bank_number']", 

                                                    " Número do banco inválido"
                                                )
                                            ]
                                        ),
                                        m("a.w-hidden-small.w-hidden-tiny.alt-link.fontsize-smaller[href='javascript:void(0);'][id='show_bank_list']", {onclick: () => ctrl.showOtherBanks.toggle()},
                                            [
                                                "Busca por nome  ",
                                                m.trust("&nbsp;"),
                                                m.trust("&gt;")
                                            ]
                                        ),
                                        m("a.w-hidden-main.w-hidden-medium.alt-link.fontsize-smaller[href='javascript:void(0);'][id='show_bank_list']", {onclick: () => ctrl.showOtherBanks.toggle()},
                                            [
                                                "Busca por nome  ",
                                                m.trust("&nbsp;"),
                                                m.trust("&gt;")
                                            ]
                                        )
                                    ]
                                )
                            )
                        ) : ''),
                        (ctrl.showOtherBanks() ? 
                        m(".w-row[id='bank_search_list']", 
                            m(".w-col.w-col-12", 
                                m(".select-bank-list[data-ix='height-0-on-load']", {style: {"height": "395px"}}, 
                                    m(".card.card-terciary",
                                        [
                                            m(".fontsize-small.fontweight-semibold.u-marginbottom-10.u-text-center", 
                                                "Selecione o seu banco abaixo"
                                            ),
                                            m(".fontsize-smaller",
                                                [
                                                    m(".w-row.card.card-secondary.fontweight-semibold",
                                                        [
                                                            m(".w-col.w-col-3.w-col-small-3.w-col-tiny-3", 
                                                                m("div", 
                                                                    "Número"
                                                                )
                                                            ),
                                                            m(".w-col.w-col-9.w-col-small-9.w-col-tiny-9", 
                                                                m("div", 
                                                                    "Nome"
                                                                )
                                                            )
                                                        ]
                                                    ),
                                                    (!_.isEmpty(ctrl.banks()) ?
                                                          _.map(ctrl.banks(), (bank) => {
                                                            return m(".w-row.card.fontsize-smallest",
                                                                [
                                                                    m(".w-col.w-col-3.w-col-small-3.w-col-tiny-3", 
                                                                        m(`a.link-hidden.bank-resource-link[data-code='${bank.code}'][data-id='${bank.id}'][href='javascript:void(0)']`, {onclick: () => {ctrl.bankInput(bank.code);ctrl.showOtherBanks.toggle();}},
                                                                            bank.code
                                                                        )
                                                                    ),
                                                                    m(".w-col.w-col-9.w-col-small-9.w-col-tiny-9", 
                                                                        m(`a.link-hidden.bank-resource-link[data-code='${bank.code}'][data-id='${bank.id}'][href='javascript:void(0)']`, {onclick: () => {ctrl.bankInput(bank.code);ctrl.showOtherBanks.toggle();}},
                                                                            `${bank.code} . ${bank.name}`
                                                                        )
                                                                    )
                                                                ]
                                                            );
                                                        }): '')
                                                ]
                                            )
                                        ]
                                    )
                                )
                            )
                        ) : ''),
                        m(".w-col.w-col-6", 
                            m(".w-row",
                                [
                                    m(".w-col.w-col-6.w-col-small-6.w-col-tiny-6.w-sub-col-middle",
                                        [
                                            m("label.text.required.field-label.field-label.fontweight-semibold.force-text-dark[for='user_bank_account_attributes_agency']", 
                                                "Agência"
                                            ),
                                            m("input.string.required.w-input.text-field.positive[id='user_bank_account_attributes_agency'][type='text']", {value: bankAccount.agency, name: 'user[bank_account_attributes][agency]'})
                                        ]
                                    ),
                                    m(".w-col.w-col-6.w-col-small-6.w-col-tiny-6",
                                        [
                                            m("label.text.optional.field-label.field-label.fontweight-semibold.force-text-dark[for='user_bank_account_attributes_agency_digit']", 
                                                "Dígito agência"
                                            ),
                                            m("input.string.optional.w-input.text-field.positive[id='user_bank_account_attributes_agency_digit'][type='text']", {value: bankAccount.agency_digit, name: 'user[bank_account_attributes][agency_digit]'})
                                        ]
                                    )
                                ]
                            )
                        )
                    ]
                ),
                m(".w-row",
                    [
                        m(".w-col.w-col-6.w-sub-col",
                            [
                                m("label.field-label.fontweight-semibold", 
                                    "Tipo de conta"
                                ),
                                m("p.fontsize-smaller.u-marginbottom-20", 
                                    "Só aceitamos conta corrente"
                                )
                            ]
                        ),
                        m(".w-col.w-col-6", 
                            m(".w-row",
                                [
                                    m(".w-col.w-col-6.w-col-small-6.w-col-tiny-6.w-sub-col-middle",
                                        [
                                            m("label.text.required.field-label.field-label.fontweight-semibold.force-text-dark[for='user_bank_account_attributes_account']", 
                                                "No. da conta"
                                            ),
                                            m("input.string.required.w-input.text-field.positive[id='user_bank_account_attributes_account'][type='text']", {value: bankAccount.account, name: 'user[bank_account_attributes][account]'})
                                        ]
                                    ),
                                    m(".w-col.w-col-6.w-col-small-6.w-col-tiny-6",
                                        [
                                            m("label.text.required.field-label.field-label.fontweight-semibold.force-text-dark[for='user_bank_account_attributes_account_digit']", 
                                                "Dígito conta"
                                            ),
                                            m("input.string.required.w-input.text-field.positive[id='user_bank_account_attributes_account_digit'][type='text']", {value: bankAccount.account_digit, name: 'user[bank_account_attributes][account_digit]'})
                                        ]
                                    )
                                ]
                            )
                        )
                    ]
                ),
                m("input[id='user_bank_account_attributes_id'][type='hidden']", {name: 'user[bank_account_attributes][id]', value: bankAccount.bank_account_id})
            ]
        ),
        m(".u-margintop-30", 
            m(".w-container", 
                m(".w-row", 
                    m(".w-col.w-col-4.w-col-push-4", 
                        m("input.btn.btn-large[name='commit'][type='submit'][value='Salvar']")
                    )
                )
            )
        )
    ]
)
            ]
        )
    )
        ]
)
              ;
    }
};

export default userBilling;
