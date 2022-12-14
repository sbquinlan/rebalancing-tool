export default function link_event_handlers<
  TEvent extends React.SyntheticEvent<unknown>
>(
  a: React.EventHandler<TEvent> | undefined,
  b: React.EventHandler<TEvent>
): React.EventHandler<TEvent> {
  return (e: TEvent) => {
    if (a) a(e);
    if (!e.defaultPrevented) b(e);
  };
}
