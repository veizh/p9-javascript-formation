/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"
import {screen, waitFor} from "@testing-library/dom"
import Bills from "../containers/Bills.js"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills"
import userEvent from "@testing-library/user-event"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)

function setupTest() {

  const root = document.createElement("div")
  root.setAttribute("id", "root")
  document.body.append(root)
  router()
  window.onNavigate(ROUTES_PATH.Bills)
  const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({ pathname })
  }
  const employeeBillsPage = new Bills({
    document,
    onNavigate,
    store: mockStore,
    localStorage: localStorageMock,
  })

  return { root, onNavigate, employeeBillsPage }
}

beforeEach(() => {
  document.body.innerHTML = BillsUI({ data: bills })
  jest.spyOn(mockStore, "bills")
  Object.defineProperty(window, "localStorage", { value: localStorageMock })
  window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }))
})



describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      setupTest()
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBe(true)

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    describe('When I click on eye icon',()=>{
      test('Then it should open a modal',()=>{
        const { employeeBillsPage } = setupTest()

        const handleClick = jest.fn((e) =>
          employeeBillsPage.handleClickIconEye(e)
        )
        $.fn.modal = jest.fn()
        let eyesIcons = screen.getAllByTestId("icon-eye")
        eyesIcons.forEach((e)=>{
          e.addEventListener("click", handleClick(e))
          userEvent.click(e)
        })
        const modal =  document.getElementById('modaleFile')
        expect(modal).toBeVisible()
        
      })
    })
     
    describe('When I click on the button "nouvelle note de frais"',()=>{
      test('Then i should redirected to the new bill page',async ()=>{
        const { employeeBillsPage } = setupTest()

        const handleClick = jest.fn((e) =>
          employeeBillsPage.handleClickNewBill(e)
        )
        const newBillButton = screen.getByTestId("btn-new-bill")
        newBillButton.addEventListener("click", handleClick)

        userEvent.click(newBillButton)

        expect(screen.getByTestId('form-new-bill')).toBeInTheDocument()

      })
    })
  })
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
  
    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"))
          }
        }
      })
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => {
        const message = screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })
    })
  
    test("fetches bills from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"))
          }
        }
      })
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => {
        const message = screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})
