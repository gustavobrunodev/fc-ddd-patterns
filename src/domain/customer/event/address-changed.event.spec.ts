import EventDispatcher from "../../@shared/event/event-dispatcher";
import EnviaConsoleLogHandler from "./handler/envia-console-log.handler";
import AddressChangedEvent from "./address-changed.event";

describe("AddressChangedEvent tests", () => {
  it("should notify all event handlers", () => {
    const eventDispatcher = new EventDispatcher();
    const eventHandler = new EnviaConsoleLogHandler();

    const spyEventHandler = jest.spyOn(eventHandler, "handle");

    eventDispatcher.register("AddressChangedEvent", eventHandler);

    expect(
      eventDispatcher.getEventHandlers["AddressChangedEvent"][0]
    ).toMatchObject(eventHandler);

    const addressChangedEvent = new AddressChangedEvent({
      id: "123",
      name: "Teste",
      address: {
        street: "teste",
        number: 0,
        zip: "49000000",
        city: "Teste",
      },
    });

    eventDispatcher.notify(addressChangedEvent);

    expect(spyEventHandler).toHaveBeenCalled();
  });
});
