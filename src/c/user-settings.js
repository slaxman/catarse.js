import m from 'mithril';
import userVM from '../vms/user-vm';
import postgrest from 'mithril-postgrest';
import _ from 'underscore';
import models from '../models';
import h from '../h';
import popNotification from './pop-notification';
import UserOwnerBox from './user-owner-box';
import inlineError from './inline-error';

const userSettings = {
    controller(args) {
        let deleteFormSubmit;
        const user = args.user,
              bankAccount = m.prop({}),
              fields = {
                  owner_document: m.prop(user.owner_document || ''),
                  country_id: m.prop(user.address.country_id || ''),
                  street: m.prop(user.address.street || ''),
                  number: m.prop(user.address.number || ''),
                  city: m.prop(user.address.city || ''),
                  zipcode: m.prop(user.address.zipcode || ''),
                  complement: m.prop(user.address.complement || ''),
                  neighbourhood: m.prop(user.address.neighbourhood || ''),
                  state: m.prop(user.address.state || ''),
                  phonenumber: m.prop(user.address.phonenumber || ''),
                  name: m.prop(user.name || ''),
                  agency: m.prop(''),
                  bank_id: m.prop(''),
                  agency_digit: m.prop(''),
                  account: m.prop(''),
                  account_digit: m.prop(''),
                  bank_account_id: m.prop(''),
                  state_inscription: m.prop(''),
                  birth_date: m.prop((user.birth_date ? h.momentify(user.birth_date) : '')),
                  account_type: m.prop(user.account_type || ''),
                  errors: m.prop([]),
                  bank_account_type: m.prop('')
              },
              fieldHasError = (fieldName) => {
                  const fieldWithError = _.findWhere(fields.errors(), {
                      field: fieldName
                  });

                  return fieldWithError ? m.component(inlineError, {
                      message: fieldWithError.message
                  }) : '';
              },
              loading = m.prop(false),
              user_id = args.userId,
              error = m.prop(''),
              countries = m.prop(),
              states = m.prop(),
              loader = m.prop(true),
              showSuccess = m.prop(false),
              showError = m.prop(false),
              countriesLoader = postgrest.loader(models.country.getPageOptions()),
              statesLoader = postgrest.loader(models.state.getPageOptions()),
              phoneMask = _.partial(h.mask, '(99) 9999-99999'),
              documentMask = _.partial(h.mask, '999.999.999-99'),
              documentCompanyMask = _.partial(h.mask, '99.999.999/9999-99'),
              zipcodeMask = _.partial(h.mask, '99999-999'),
              birthDayMask = _.partial(h.mask, '99/99/9999'),
              isCnpj = m.prop(false),
              creditCards = m.prop(),
              toDeleteCard = m.prop(-1),
              bankInput = m.prop(''),
              bankCode = m.prop('-1'),
              banks = m.prop(),
              banksLoader = postgrest.loader(models.bank.getPageOptions()),
              showOtherBanks = h.toggleProp(false, true),
              showOtherBanksInput = m.prop(false),
              popularBanks = [{
                  id: '51',
                  code: '001',
                  name: 'Banco do Brasil S.A.'
              }, {
                  id: '131',
                  code: '341',
                  name: 'Itaú Unibanco S.A.'
              }, {
                  id: '122',
                  code: '104',
                  name: 'Caixa Econômica Federal'
              }, {
                  id: '104',
                  code: '033',
                  name: 'Banco Santander  (Brasil)  S.A.'
              }, {
                  id: '127',
                  code: '399',
                  name: 'HSBC Bank Brasil S.A. - Banco Múltiplo'
              }, {
                  id: '23',
                  code: '237',
                  name: 'Banco Bradesco S.A.'
              }],
              deleteCard = (id) => () => {
                  toDeleteCard(id);
                  // We must redraw here to update the action output of the hidden form on the DOM.
                  m.redraw(true);
                  deleteFormSubmit();
                  return false;
              },
              setCardDeletionForm = (el, isInit) => {
                  if (!isInit) {
                      deleteFormSubmit = () => el.submit();
                  }
              },
              updateUserData = (user_id) => {
                  const userData = {
                      country_id: fields.country_id(),
                      address_street: fields.street(),
                      address_number: fields.number(),
                      address_city: fields.city(),
                      address_zip_code: fields.zipcode(),
                      address_complement: fields.complement(),
                      address_state: fields.state(),
                      address_neighbourhood: fields.neighbourhood(),
                      phone_number: fields.phonenumber(),
                      cpf: fields.owner_document(),
                      name: fields.name(),
                      account_type: fields.account_type(),
                      birth_date: fields.birth_date(),
                      bank_account_attributes: {
                          owner_name: fields.name(),
                          owner_document: fields.owner_document(),
                          bank_id: bankCode(),
                          input_bank_number: bankInput(),
                          agency_digit: fields.agency_digit(),
                          agency: fields.agency(),
                          account: fields.account(),
                          account_digit: fields.account_digit(),
                          account_type: fields.bank_account_type()
                      }
                  };

                  if((fields.bank_account_id())){
                      userData.bank_account_attributes['id'] = fields.bank_account_id().toString();
                  }

                  return m.request({
                      method: 'PUT',
                      url: `/users/${user_id}.json`,
                      data: {
                          user: userData
                      },
                      config: h.setCsrfToken
                  }).then(() => {
                      loading(false);
                      showSuccess(true);
                      m.redraw();
                  }).catch((err) => {
                      if (_.isArray(err.errors)) {
                          error(err.errors.join('<br>'));
                      } else {
                          error('Error updating information.');
                      }
                      loading(false);
                      showError(true);
                      m.redraw();
                  });
              },
              validateDocument = () => {
                  const document = fields.owner_document(),
                        striped = String(document).replace(/[\.|\-|\/]*/g,'');
                  let isValid = false, errorMessage = '';

                  if (document.length > 14) {
                      return h.validateCnpj(document);
                  } else if (document.length > 0) {
                      return h.validateCpf(striped);
                  }
                  return void(0);
              },
              onSubmit = () => {
                  // TODO: this form validation should be abstracted/merged together with others
                  if (!validateDocument()) {
                      fields.errors().push({field: 'owner_document', message: 'CPF/CNPJ inválido'});
                      error('CPF/CNPJ inválido');
                      showError(true);
                  } else {
                      loading(true);
                      updateUserData(user_id);
                  }

                  m.redraw();
                  return false;
              },
              applyZipcodeMask = _.compose(fields.zipcode, zipcodeMask),
              applyBirthDateMask = _.compose(fields.birth_date, birthDayMask),
              applyPhoneMask = _.compose(fields.phonenumber, phoneMask),
              applyDocumentMask = (value) => {
                  if(value.length > 14) {
                      isCnpj(true);
                      fields.owner_document(documentCompanyMask(value));
                  } else  {
                      isCnpj(false);
                      fields.owner_document(documentMask(value));
                  }

                  return;
              },
              handleError = () => {
                  error(true);
                  loader(false);
                  m.redraw();
              };

        userVM.getUserBankAccount(user_id).then(data => {
            if(!_.isEmpty(_.first(data))){
                bankAccount(_.first(data));
                fields.bank_account_id(bankAccount().bank_account_id);
                fields.account(bankAccount().account);
                fields.account_digit(bankAccount().account_digit);
                fields.agency(bankAccount().agency);
                fields.agency_digit(bankAccount().agency_digit);
                fields.bank_id(bankAccount().bank_id);
                fields.bank_account_type(bankAccount().account_type);
                bankCode(bankAccount().bank_id);
            }
        }).catch(handleError);

        banksLoader.load().then(banks).catch(handleError);
        userVM.getUserCreditCards(args.userId).then(creditCards).catch(handleError);
        countriesLoader.load().then((data) => countries(_.sortBy(data, 'name_en')));
        statesLoader.load().then(states);

        return {
            handleError,
            applyDocumentMask,
            applyZipcodeMask,
            applyPhoneMask,
            countries,
            states,
            fields,
            loader,
            showSuccess,
            showError,
            user,
            onSubmit,
            error,
            creditCards,
            deleteCard,
            toDeleteCard,
            setCardDeletionForm,
            bankAccount,
            bankInput,
            banks,
            showOtherBanks,
            showOtherBanksInput,
            bankCode,
            popularBanks,
            applyBirthDateMask,
            loading,
            fieldHasError
        };
    },
    view(ctrl, args) {
        let user = ctrl.user,
            bankAccount = ctrl.bankAccount(),
            fields = ctrl.fields;

        console.log(fields.bank_account_type());

        return m('[id=\'settings-tab\']', [
            (ctrl.showSuccess() ? m.component(popNotification, {
                message: 'Your information has been updated'
            }) : ''),
            (ctrl.showError() ? m.component(popNotification, {
                message: m.trust(ctrl.error()),
                error: true
            }) : ''),
            m('form.w-form', {
                onsubmit: ctrl.onSubmit
            }, [
                m('div', [
                    m('.w-container',
                        m('.w-col.w-col-10.w-col-push-1',
                          //( _.isEmpty(fields.name()) && _.isEmpty(fields.owner_document()) ? '' : m(UserOwnerBox, {user: user}) ),
                          m('.w-form.card.card-terciary', [
                              m('.fontsize-base.fontweight-semibold',
                                'Financial data'
                               ),
                              m('.fontsize-small.u-marginbottom-20', [
                                  'This will be the information for transferring funds raised on the platform or reimbursement of support made via bank wire for non-funded projects.'
                              ]),
                              m('.divider.u-marginbottom-20'),
                              m('.w-row', [
                                  m(`.w-col.w-col-6.w-sub-col`,
                                    m('.input.select.required.user_bank_account_bank_id', [
                                        m('select.select.required.w-input.text-field.bank-select.positive[id=\'user_bank_account_attributes_bank_id\']', {
                                            name: 'user[bank_account_attributes][bank_id]',
                                            onchange: m.withAttr('value', fields.account_type)
                                        }, [
                                            m('option[value=\'pf\']', {selected: fields.account_type() === 'pf'}, 'Pessoa fisica'),
                                            m('option[value=\'pj\']', {selected: fields.account_type() === 'pj'}, 'Pessoa juririca'),
                                            m('option[value=\'mei\']', {selected: fields.account_type() === 'mei'}, 'Pessoa juridica - MEI'),
                                        ])
                                    ])
                                   ),
                              ]),
                              m('.w-row', [
                                  m('.w-col.w-col-6.w-sub-col', [
                                      m('label.text.required.field-label.field-label.fontweight-semibold.force-text-dark[for=\'user_bank_account_attributes_owner_name\']',
                                        `Full name${fields.account_type() == 'pf' ? '' : '/Razão Social'}`
                                       ),
                                      m(`input.string.required.w-input.text-field.positive[id='user_bank_account_attributes_owner_name'][type='text']`, {
                                          value: fields.name(),
                                          name: 'user[name]',
                                          onchange: m.withAttr('value', fields.name)
                                      })
                                  ]),
                                  m('.w-col.w-col-6', [
                                      m('.w-row', [
                                          m('.w-col.w-col-6.w-col-small-6.w-col-tiny-6.w-sub-col-middle', [
                                              m('label.text.required.field-label.field-label.fontweight-semibold.force-text-dark[for=\'user_bank_account_attributes_owner_document\']',
                                                `${fields.account_type() == 'pf' ? 'CPF' : 'CNPJ'}`
                                               ),
                                              m('input.string.tel.required.w-input.text-field.positive[data-validate-cpf-cnpj=\'true\'][id=\'user_bank_account_attributes_owner_document\'][type=\'tel\'][validation_text=\'true\']', {
                                                  value: fields.owner_document(),
                                                  class: ctrl.fieldHasError('owner_document') ? 'error' : false,
                                                  name: 'user[cpf]',
                                                  onchange: m.withAttr('value', ctrl.applyDocumentMask),
                                                  onkeyup: m.withAttr('value', ctrl.applyDocumentMask)
                                              }),
                                              ctrl.fieldHasError('owner_document')
                                          ]),
                                          m('.w-col.w-col-6.w-col-small-6.w-col-tiny-6', (fields.account_type() == 'pf' ? [
                                              m('label.text.required.field-label.field-label.fontweight-semibold.force-text-dark[for=\'user_bank_account_attributes_owner_document\']',
                                                'Date of birth'
                                               ),
                                              m('input.string.tel.required.w-input.text-field.positive[data-validate-cpf-cnpj=\'true\'][id=\'user_bank_account_attributes_owner_document\'][type=\'tel\'][validation_text=\'true\']', {
                                                  value: fields.birth_date(),
                                                  name: 'user[birth_date]',
                                                  onchange: m.withAttr('value', ctrl.applyBirthDateMask),
                                                  onkeyup: m.withAttr('value', ctrl.applyBirthDateMask)
                                              })
                                          ] : [
                                              m('label.text.required.field-label.field-label.fontweight-semibold.force-text-dark[for=\'user_bank_account_attributes_owner_document\']',
                                                'State Registration'
                                               ),
                                              m('input.string.tel.required.w-input.text-field.positive[data-validate-cpf-cnpj=\'true\'][id=\'user_bank_account_attributes_owner_document\'][type=\'tel\'][validation_text=\'true\']', {
                                                  value: fields.state_inscription(),
                                                  name: 'user[state_inscription]',
                                                  onchange: m.withAttr('value', fields.state_inscription)
                                              })
                                          ]))
                                      ])
                                  ])

                              ]),
                              m('.w-row', [
                                  m(`.w-col.w-col-6.w-sub-col${ctrl.showOtherBanksInput() ? '.w-hidden' : ''}[id='bank_select']`,
                                    m('.input.select.required.user_bank_account_bank_id', [
                                        m('label.field-label',
                                          'Bank'
                                         ),
                                        m('select.select.required.w-input.text-field.bank-select.positive[id=\'user_bank_account_attributes_bank_id\']', {
                                            name: 'user[bank_account_attributes][bank_id]',
                                            onchange: (e) => {
                                                m.withAttr('value', ctrl.bankCode)(e);
                                                ctrl.showOtherBanksInput(ctrl.bankCode() == '0');
                                            }
                                        }, [
                                            m('option[value=\'\']', {selected: fields.bank_id() === ''}),
                                            (_.map(ctrl.popularBanks, (bank) => {
                                                return (fields.bank_id() != bank.id ? m(`option[value='${bank.id}']`, {
                                                    selected: fields.bank_id() == bank.id
                                                },
                                                                                        `${bank.code} . ${bank.name}`) : '');
                                            })),
                                            (fields.bank_id() === '' || _.find(ctrl.popularBanks, (bank) => {
                                                return bank.id === fields.bank_id();
                                            }) ? '' :
                                             m(`option[value='${fields.bank_id()}']`, {
                                                 selected: true
                                             },
                                               `${bankAccount.bank_code} . ${bankAccount.bank_name}`
                                              )
                                            ),
                                            m('option[value=\'0\']',
                                              'Other'
                                             )
                                        ]),
                                        m('.fontsize-smaller.text-error.u-marginbottom-20.fa.fa-exclamation-triangle.w-hidden[data-error-for=\'user_bank_account_attributes_bank_id\']',
                                          ' Select a bank'
                                         )
                                    ])
                                   ),
                                  (ctrl.showOtherBanksInput() ?
                                   m('.w-col.w-col-6.w-sub-col',
                                     m('.w-row.u-marginbottom-20[id=\'bank_search\']',
                                       m('.w-col.w-col-12', [
                                           m('.input.string.optional.user_bank_account_input_bank_number', [
                                               m('label.field-label',
                                                 'Bank Number (3 numbers)'
                                                ),
                                               m('input.string.optional.w-input.text-field.bank_account_input_bank_number[id=\'user_bank_account_attributes_input_bank_number\'][maxlength=\'3\'][size=\'3\'][type=\'text\']', {
                                                   name: 'user[bank_account_attributes][input_bank_number]',
                                                   value: ctrl.bankInput(),
                                                   onchange: m.withAttr('value', ctrl.bankInput)
                                               }),
                                               m('.fontsize-smaller.text-error.u-marginbottom-20.fa.fa-exclamation-triangle.w-hidden[data-error-for=\'user_bank_account_attributes_input_bank_number\']',

                                                 ' Invalid bank number'
                                                )
                                           ]),
                                           m('a.w-hidden-small.w-hidden-tiny.alt-link.fontsize-smaller[href=\'javascript:void(0);\'][id=\'show_bank_list\']', {
                                               onclick: ctrl.showOtherBanks.toggle
                                           }, [
                                               'Busca por nome  ',
                                               m.trust('&nbsp;'),
                                               m.trust('&gt;')
                                           ]),
                                           m('a.w-hidden-main.w-hidden-medium.alt-link.fontsize-smaller[href=\'javascript:void(0);\'][id=\'show_bank_list\']', {
                                               onclick: ctrl.showOtherBanks.toggle
                                           }, [
                                               'Busca por nome  ',
                                               m.trust('&nbsp;'),
                                               m.trust('&gt;')
                                           ])
                                       ])
                                      )
                                    ) : ''),
                                  (ctrl.showOtherBanks() ?
                                   m('.w-row[id=\'bank_search_list\']',
                                     m('.w-col.w-col-12',
                                       m('.select-bank-list[data-ix=\'height-0-on-load\']', {
                                           style: {
                                               'height': '395px'
                                           }
                                       },
                                         m('.card.card-terciary', [
                                             m('.fontsize-small.fontweight-semibold.u-marginbottom-10.u-text-center',
                                               'Selecione o seu banco abaixo'
                                              ),
                                             m('.fontsize-smaller', [
                                                 m('.w-row.card.card-secondary.fontweight-semibold', [
                                                     m('.w-col.w-col-3.w-col-small-3.w-col-tiny-3',
                                                       m('div',
                                                         'Número'
                                                        )
                                                      ),
                                                     m('.w-col.w-col-9.w-col-small-9.w-col-tiny-9',
                                                       m('div',
                                                         'Nome'
                                                        )
                                                      )
                                                 ]),
                                                 (!_.isEmpty(ctrl.banks()) ?
                                                  _.map(ctrl.banks(), (bank) => {
                                                      return m('.w-row.card.fontsize-smallest', [
                                                          m('.w-col.w-col-3.w-col-small-3.w-col-tiny-3',
                                                            m(`a.link-hidden.bank-resource-link[data-code='${bank.code}'][data-id='${bank.id}'][href='javascript:void(0)']`, {
                                                                onclick: () => {
                                                                    ctrl.bankInput(bank.code);
                                                                    ctrl.showOtherBanks.toggle();
                                                                }
                                                            },
                                                              bank.code
                                                             )
                                                           ),
                                                          m('.w-col.w-col-9.w-col-small-9.w-col-tiny-9',
                                                            m(`a.link-hidden.bank-resource-link[data-code='${bank.code}'][data-id='${bank.id}'][href='javascript:void(0)']`, {
                                                                onclick: () => {
                                                                    ctrl.bankInput(bank.code);
                                                                    ctrl.showOtherBanks.toggle();
                                                                }
                                                            },
                                                              `${bank.code} . ${bank.name}`
                                                             )
                                                           )
                                                      ]);
                                                  }) : '')
                                             ])
                                         ])
                                        )
                                      )
                                    ) : ''),
                                  m('.w-col.w-col-6',
                                    m('.w-row', [
                                        m('.w-col.w-col-6.w-col-small-6.w-col-tiny-6.w-sub-col-middle', [
                                            m('label.text.required.field-label.field-label.fontweight-semibold.force-text-dark[for=\'user_bank_account_attributes_agency\']',
                                              'Agência'
                                             ),
                                            m('input.string.required.w-input.text-field.positive[id=\'user_bank_account_attributes_agency\'][type=\'text\']', {
                                                value: fields.agency(),
                                                name: 'user[bank_account_attributes][agency]',
                                                onchange: m.withAttr('value', fields.agency)
                                            })
                                        ]),
                                        m('.w-col.w-col-6.w-col-small-6.w-col-tiny-6', [
                                            m('label.text.optional.field-label.field-label.fontweight-semibold.force-text-dark[for=\'user_bank_account_attributes_agency_digit\']',
                                              'Dígito agência'
                                             ),
                                            m('input.string.optional.w-input.text-field.positive[id=\'user_bank_account_attributes_agency_digit\'][type=\'text\']', {
                                                value: fields.agency_digit(),
                                                name: 'user[bank_account_attributes][agency_digit]',
                                                onchange: m.withAttr('value', fields.agency_digit)
                                            })
                                        ])
                                    ])
                                   )
                              ]),
                              m('.w-row', [
                                  m('.w-col.w-col-6.w-sub-col', [
                                      m('label.field-label.fontweight-semibold',
                                        'Tipo de conta'
                                       ),
                                      m('.input.select.required.user_bank_account_account_type', [
                                          m('select.select.required.w-input.text-field.bank-select.positive[id=\'user_bank_account_attributes_account_type\']', {
                                              name: 'user[bank_account_attributes][account_type]',
                                              onchange: m.withAttr('value', fields.bank_account_type)
                                          }, [
                                              m('option[value=\'conta_corrente\']', {selected: fields.bank_account_type() === 'conta_corrente'}, 'Conta corrente'),
                                              m('option[value=\'conta_poupanca\']', {Selected: fields.bank_account_type() === 'conta_poupanca'}, 'Conta poupança'),
                                              m('option[value=\'conta_corrente_conjunta\']', {selected: fields.bank_account_type() === 'conta_corrente_conjunta'}, 'Conta corrente conjunta'),
                                              m('option[value=\'conta_poupanca_conjunta\']', {Selected: fields.bank_account_type() === 'conta_poupanca_conjunta'}, 'Conta poupança conjunta'),
                                          ])
                                      ])
                                  ]),
                                  m('.w-col.w-col-6',
                                    m('.w-row', [
                                        m('.w-col.w-col-6.w-col-small-6.w-col-tiny-6.w-sub-col-middle', [
                                            m('label.text.required.field-label.field-label.fontweight-semibold.force-text-dark[for=\'user_bank_account_attributes_account\']',
                                              'No. da conta'
                                             ),
                                            m('input.string.required.w-input.text-field.positive[id=\'user_bank_account_attributes_account\'][type=\'text\']', {
                                                value: fields.account(),
                                                onchange: m.withAttr('value', fields.account),
                                                name: 'user[bank_account_attributes][account]'
                                            })
                                        ]),
                                        m('.w-col.w-col-6.w-col-small-6.w-col-tiny-6', [
                                            m('label.text.required.field-label.field-label.fontweight-semibold.force-text-dark[for=\'user_bank_account_attributes_account_digit\']',
                                              'Dígito conta'
                                             ),
                                            m('input.string.required.w-input.text-field.positive[id=\'user_bank_account_attributes_account_digit\'][type=\'text\']', {
                                                value: fields.account_digit(),
                                                onchange: m.withAttr('value', fields.account_digit),
                                                name: 'user[bank_account_attributes][account_digit]'
                                            })
                                        ])
                                    ])
                                   )
                              ]),
                              (bankAccount.bank_account_id ?
                               m('input[id=\'user_bank_account_attributes_id\'][type=\'hidden\']', {
                                   name: 'user[bank_account_attributes][id]',
                                   value: fields.bank_account_id()
                               }) : '')
                          ]),
                          m('.w-form.card.card-terciary.u-marginbottom-20', [
                              m('.fontsize-base.fontweight-semibold',
                                'Endereço'
                               ),
                              m('.w-row', [
                                  m('.input.select.optional.user_country.w-col.w-col-6.w-sub-col', [
                                      m('label.field-label',
                                        'País'
                                       ),
                                      m('select.select.optional.w-input.text-field.w-select.positive[id=\'user_country_id\'][name=\'user[country_id]\']', {
                                          onchange: m.withAttr('value', fields.country_id)
                                      }, [
                                          m('option[value=\'\']'),
                                          (!_.isEmpty(ctrl.countries()) ?
                                           _.map(ctrl.countries(), (country) => {
                                               return m(`option${country.id == fields.country_id() ? '[selected="selected"]' : ''}`, {
                                                   value: country.id
                                               },
                                                        country.name_en
                                                       );
                                           })
                                           :
                                           '')
                                      ])
                                  ]),
                                  m('.w-col.w-col-6')
                              ]),
                              m('.w-row', [
                                  m('.input.string.optional.user_address_street.w-col.w-col-6.w-sub-col', [
                                      m('label.field-label',
                                        'Endereço'
                                       ),
                                      m('input.string.optional.w-input.text-field.w-input.text-field.positive[data-required-in-brazil=\'true\'][id=\'user_address_street\'][name=\'user[address_street]\'][type=\'text\']', {
                                          value: fields.street(),
                                          onchange: m.withAttr('value', fields.street)
                                      }),
                                      m('.fontsize-smaller.text-error.u-marginbottom-20.fa.fa-exclamation-triangle.w-hidden[data-error-for=\'user_address_street\']',
                                        ' translation missing: pt.simple_form.validation_texts.user.address_street'
                                       )
                                  ]),
                                  m('.w-col.w-col-6',
                                    m('.w-row', [
                                        m('.input.tel.optional.user_address_number.w-col.w-col-6.w-col-small-6.w-col-tiny-6.w-sub-col-middle', [
                                            m('label.field-label',
                                              'Número'
                                             ),
                                            m('input.string.tel.optional.w-input.text-field.w-input.text-field.positive[id=\'user_address_number\'][name=\'user[address_number]\'][type=\'tel\']', {
                                                value: fields.number(),
                                                onchange: m.withAttr('value', fields.number)
                                            }),
                                            m('.fontsize-smaller.text-error.u-marginbottom-20.fa.fa-exclamation-triangle.w-hidden[data-error-for=\'user_address_number\']',
                                              ' translation missing: pt.simple_form.validation_texts.user.address_number'
                                             )
                                        ]),
                                        m('.input.string.optional.user_address_complement.w-col.w-col-6.w-col-small-6.w-col-tiny-6', [
                                            m('label.field-label',
                                              'Complemento'
                                             ),
                                            m('input.string.optional.w-input.text-field.w-input.text-field.positive[id=\'user_address_complement\'][name=\'user[address_complement]\'][type=\'text\']', {
                                                value: fields.complement(),
                                                onchange: m.withAttr('value', fields.complement)
                                            })
                                        ])
                                    ])
                                   )
                              ]),
                              m('.w-row', [
                                  m('.input.string.optional.user_address_neighbourhood.w-col.w-col-6.w-sub-col', [
                                      m('label.field-label',
                                        'Bairro'
                                       ),
                                      m('input.string.optional.w-input.text-field.w-input.text-field.positive[id=\'user_address_neighbourhood\'][name=\'user[address_neighbourhood]\'][type=\'text\']', {
                                          value: fields.neighbourhood(),
                                          onchange: m.withAttr('value', fields.neighbourhood)
                                      })
                                  ]),
                                  m('.input.string.optional.user_address_city.w-col.w-col-6', [
                                      m('label.field-label',
                                        'Cidade'
                                       ),
                                      m('input.string.optional.w-input.text-field.w-input.text-field.positive[data-required-in-brazil=\'true\'][id=\'user_address_city\'][name=\'user[address_city]\'][type=\'text\']', {
                                          value: fields.city(),
                                          onchange: m.withAttr('value', fields.city)
                                      }),
                                      m('.fontsize-smaller.text-error.u-marginbottom-20.fa.fa-exclamation-triangle.w-hidden[data-error-for=\'user_address_city\']',
                                        ' translation missing: pt.simple_form.validation_texts.user.address_city'
                                       )
                                  ])
                              ]),
                              m('.w-row', [
                                  m('.input.select.optional.user_address_state.w-col.w-col-6.w-sub-col', [
                                      m('label.field-label',
                                        'Estado'
                                       ),
                                      m('select.select.optional.w-input.text-field.w-select.text-field.positive[data-required-in-brazil=\'true\'][id=\'user_address_state\'][name=\'user[address_state]\']', {

                                          onchange: m.withAttr('value', fields.state)
                                      }, [
                                          m('option[value=\'\']'),
                                          (!_.isEmpty(ctrl.states()) ?
                                           _.map(ctrl.states(), (state) => {
                                               return m(`option[value='${state.acronym}']${state.acronym == fields.state() ? '[selected="selected"]' : ''}`, {
                                                   value: state.acronym
                                               },
                                                        state.name
                                                       );
                                           })
                                           :
                                           ''),
                                          m('option[value=\'outro / other\']',
                                            'Outro / Other'
                                           )
                                      ]),
                                      m('.fontsize-smaller.text-error.u-marginbottom-20.fa.fa-exclamation-triangle.w-hidden[data-error-for=\'user_address_state\']',
                                        ' translation missing: pt.simple_form.validation_texts.user.address_state'
                                       )
                                  ]),
                                  m('.w-col.w-col-6',
                                    m('.w-row', [
                                        m('.input.tel.optional.user_address_zip_code.w-col.w-col-6.w-col-small-6.w-col-tiny-6.w-sub-col-middle', [
                                            m('label.field-label',
                                              'CEP'
                                             ),
                                            m('input.string.tel.optional.w-input.text-field.w-input.text-field.positive[data-fixed-mask=\'99999-999\'][data-required-in-brazil=\'true\'][id=\'user_address_zip_code\'][name=\'user[address_zip_code]\'][type=\'tel\']', {
                                                value: fields.zipcode(),
                                                onchange: m.withAttr('value', fields.zipcode)
                                            }),
                                            m('.fontsize-smaller.text-error.u-marginbottom-20.fa.fa-exclamation-triangle.w-hidden[data-error-for=\'user_address_zip_code\']',
                                              ' translation missing: pt.simple_form.validation_texts.user.address_zip_code'
                                             )
                                        ]),
                                        m('.input.tel.optional.user_phone_number.w-col.w-col-6.w-col-small-6.w-col-tiny-6', [
                                            m('label.field-label',
                                              'Telefone'
                                             ),
                                            m('input.string.tel.optional.w-input.text-field.w-input.text-field.positive[data-fixed-mask=\'(99) 9999-99999\'][data-required-in-brazil=\'true\'][id=\'user_phone_number\'][name=\'user[phone_number]\'][type=\'tel\']', {
                                                value: fields.phonenumber(),
                                                onchange: m.withAttr('value', fields.phonenumber),
                                                onkeyup: m.withAttr('value', (value) => ctrl.applyPhoneMask(value))
                                            })
                                        ])
                                    ])
                                   )
                              ]),
                          ]),
                          (args.hideCreditCards ? '' : m('.w-form.card.card-terciary.u-marginbottom-20', [
                              m('.fontsize-base.fontweight-semibold',
                                'Cartões de crédito'
                               ),
                              m('.fontsize-small.u-marginbottom-20', [
                                  'Caso algum projeto que você tenha apoiado ',
                                  m('b',
                                    'com Cartão de Crédito'
                                   ),
                                  ' não seja bem-sucedido, nós efetuaremos o reembolso ',
                                  m('b',
                                    'automaticamente'
                                   ),
                                  ' no cartão utilizado para efetuar o apoio. '
                              ]),
                              m('.divider.u-marginbottom-20'),
                              m('.w-row.w-hidden-tiny.card', [
                                  m('.w-col.w-col-5.w-col-small-5',
                                    m('.fontsize-small.fontweight-semibold',
                                      'Cartão'
                                     )
                                   ),
                                  m('.w-col.w-col-5.w-col-small-5',
                                    m('.fontweight-semibold.fontsize-small',
                                      'Operadora'
                                     )
                                   ),
                                  m('.w-col.w-col-2.w-col-small-2')
                              ]),

                              (_.map(ctrl.creditCards(), (card) => {
                                  return m('.w-row.card', [
                                      m('.w-col.w-col-5.w-col-small-5',
                                        m('.fontsize-small.fontweight-semibold', [
                                            'XXXX XXXX XXXX',
                                            m.trust('&nbsp;'),
                                            card.last_digits
                                        ])
                                       ),
                                      m('.w-col.w-col-5.w-col-small-5',
                                        m('.fontsize-small.fontweight-semibold.u-marginbottom-10',
                                          card.card_brand.toUpperCase()
                                         )
                                       ),
                                      m('.w-col.w-col-2.w-col-small-2',
                                        m(`a.btn.btn-terciary.btn-small[rel=\'nofollow\']`,
                                          {onclick: ctrl.deleteCard(card.id)},
                                          'Remover'
                                         )
                                       )
                                  ]);
                              })),
                              m('form.w-hidden', {action: `/pt/users/${user.id}/credit_cards/${ctrl.toDeleteCard()}`, method: 'POST', config: ctrl.setCardDeletionForm}, [
                                  m('input[name=\'utf8\'][type=\'hidden\'][value=\'✓\']'),
                                  m('input[name=\'_method\'][type=\'hidden\'][value=\'delete\']'),
                                  m(`input[name='authenticity_token'][type='hidden'][value='${h.authenticityToken()}']`),
                              ])
                          ])),
                       )
                     ),
                    m('div',
                      m(`.w-container${(args.useFloatBtn ? '.w-section.save-draft-btn-section' : '')}`,
                        m('.w-row', [
                            m('.w-col.w-col-4.w-col-push-4',
                              (ctrl.loading() ? h.loader() :  m('input.btn.btn.btn-large[name=\'commit\'][type=\'submit\'][value=\'Salvar\']') )
                             ),
                            m('.w-col.w-col-4')
                        ])
                       )
                     )
                ])
            ])
        ]);
    }
};

export default userSettings;
