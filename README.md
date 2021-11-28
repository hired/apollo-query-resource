# Apollo Query Result

Proof of concept implementation of Suspense for Data Fetching for Apollo.

> **WARNING!** This is not a real package (yet)!

## Implementation Details

Check out the [useQueryResource](src/useQueryResource.ts).

### [useObservableQuery](src/useObservableQuery.ts)

First, we assign a unique ID to every query. By default, it is an operation name, but it can be configured explicitly.
Then, we create an `ObservableQuery` and cache it in a [Suspense Cache](https://github.com/reactwg/react-18/discussions/25).
Every ID corresponds to exactly one `ObservableQuery`.

```typescript
const observableQuert = useObservableQuery(document, { variables });
```

### [useObservableQueryState](src/useObservableQueryState.ts)

Next, we subscribe to `ObservableQuery` updates using new [useSyncExternalStore](https://github.com/reactwg/react-18/discussions/86) API.
Similar to the standard `useQuery`.

```typescript
const { loading, data, networkError, graphQLErrors } = useObservableQueryState(observableQuery);
```

### [settleObservableQuery](src/settleObservableQuery.ts)

To suspend `ObservableQuery` we have a helper that suspends query while `loading` is true.
It also uses [Suspense Cache](https://github.com/reactwg/react-18/discussions/25) to maintain a map
between `ObservableQuery` and a suspension `Promises.

```typescript
settleObservableQuery(observableQuery); // Suspends!
```

### [useQueryResource](src/useQueryResource.ts)

Finally, we wrap everything together into a [QueryResource](src/QueryResource.ts).

```typescript
const resource = useQueryResource(document, { variables });

resource.read(); // Suspends!

// You can also work with data as usual
resource.isLoading();
resource.error();
```

## Example

```typescript
import { gql } from "@apollo/client";
import { useQueryResource } from "@hired/apollo-query-resource";

const GetPostQuery = gql`
  query GetPost($postId: Int!) {
    post(id: $postId) {
      id
      title
      body
    }
  }
`;

interface GetPostResult {
  post: {
    id: number;
    title: string;
    body: string;
  }
}

interface interface GetPostVariables {
  postId: number;
}

export const Post({ postId }: { postId: number }) {
  const resource = useQueryResource<GetPostResult, GetPostVariables>(GetPostQuery, { variables: { postId } })

  // No errors, no loading, just data!
  const { post: { title, body }} = resource.read(); // Suspends!

  return (
    <>
      <h1>{title}</h1>
      <p>{body}</p>
    <>
  );
}
```

## Requirements

Currently only works with React 18 `experimental`.
