import fetch from "fetch-with-proxy";
import invariant from "invariant";
import env from "@server/env";
import Logger from "@server/logging/Logger";
import {
  Collection,
  FileOperation,
  Group,
  Integration,
  Pin,
  Star,
  Team,
  WebhookDelivery,
  WebhookSubscription,
  Document,
  User,
  Revision,
  View,
  Share,
  CollectionUser,
  CollectionGroup,
  GroupUser,
} from "@server/models";
import {
  presentCollection,
  presentDocument,
  presentRevision,
  presentFileOperation,
  presentGroup,
  presentIntegration,
  presentPin,
  presentStar,
  presentTeam,
  presentUser,
  presentWebhook,
  presentWebhookSubscription,
  presentView,
  presentShare,
  presentMembership,
  presentGroupMembership,
  presentCollectionGroupMembership,
} from "@server/presenters";
import { WebhookPayload } from "@server/presenters/webhook";
import {
  CollectionEvent,
  CollectionGroupEvent,
  CollectionUserEvent,
  DocumentEvent,
  Event,
  FileOperationEvent,
  GroupEvent,
  GroupUserEvent,
  IntegrationEvent,
  PinEvent,
  RevisionEvent,
  ShareEvent,
  StarEvent,
  TeamEvent,
  UserEvent,
  ViewEvent,
  WebhookSubscriptionEvent,
} from "@server/types";
import BaseTask from "./BaseTask";

function assertUnreachable(event: never) {
  Logger.warn(`DeliverWebhookTask did not handle ${(event as any).name}`);
}

type Props = {
  subscriptionId: string;
  event: Event;
};

export default class DeliverWebhookTask extends BaseTask<Props> {
  public async perform({ subscriptionId, event }: Props) {
    const subscription = await WebhookSubscription.findByPk(subscriptionId);
    invariant(subscription, "Subscription not found");

    Logger.info(
      "task",
      `DeliverWebhookTask: ${event.name} for ${subscription.name}`
    );

    switch (event.name) {
      case "api_keys.create":
      case "api_keys.delete":
        // Ignored
        return;
      case "users.create":
      case "users.signin":
      case "users.signout":
      case "users.update":
      case "users.suspend":
      case "users.activate":
      case "users.delete":
      case "users.invite":
        await this.handleUserEvent(subscription, event);
        return;
      case "documents.create":
      case "documents.publish":
      case "documents.unpublish":
      case "documents.delete":
      case "documents.permanent_delete":
      case "documents.archive":
      case "documents.unarchive":
      case "documents.restore":
      case "documents.star":
      case "documents.unstar":
      case "documents.move":
      case "documents.update":
      case "documents.title_change":
        await this.handleDocumentEvent(subscription, event);
        return;
      case "documents.update.delayed":
      case "documents.update.debounced":
        // Ignored
        return;
      case "revisions.create":
        await this.handleRevisionEvent(subscription, event);
        return;
      case "fileOperations.create":
      case "fileOperations.update":
      case "fileOperation.delete":
        await this.handleFileOperationEvent(subscription, event);
        return;
      case "collections.create":
      case "collections.update":
      case "collections.delete":
      case "collections.move":
      case "collections.permission_changed":
        await this.handleCollectionEvent(subscription, event);
        return;
      case "collections.add_user":
      case "collections.remove_user":
        await this.handleCollectionUserEvent(subscription, event);
        return;
      case "collections.add_group":
      case "collections.remove_group":
        await this.handleCollectionGroupEvent(subscription, event);
        return;
      case "groups.create":
      case "groups.update":
      case "groups.delete":
        await this.handleGroupEvent(subscription, event);
        return;
      case "groups.add_user":
      case "groups.remove_user":
        await this.handleGroupUserEvent(subscription, event);
        return;
      case "integrations.create":
      case "integrations.update":
        await this.handleIntegrationEvent(subscription, event);
        return;
      case "teams.update":
        await this.handleTeamEvent(subscription, event);
        return;
      case "pins.create":
      case "pins.update":
      case "pins.delete":
        await this.handlePinEvent(subscription, event);
        return;
      case "stars.create":
      case "stars.update":
      case "stars.delete":
        await this.handleStarEvent(subscription, event);
        return;
      case "shares.create":
      case "shares.update":
      case "shares.revoke":
        await this.handleShareEvent(subscription, event);
        return;
      case "webhook_subscriptions.create":
      case "webhook_subscriptions.delete":
      case "webhook_subscriptions.update":
        await this.handleWebhookSubscriptionEvent(subscription, event);
        return;
      case "views.create":
        await this.handleViewEvent(subscription, event);
        return;
      default:
        assertUnreachable(event);
    }
  }

  private async handleWebhookSubscriptionEvent(
    subscription: WebhookSubscription,
    event: WebhookSubscriptionEvent
  ): Promise<void> {
    const model = await WebhookSubscription.findByPk(event.modelId, {
      paranoid: false,
    });

    await this.sendWebhook({
      event,
      subscription,
      payload: {
        id: event.modelId,
        model: model && presentWebhookSubscription(model),
      },
    });
  }

  private async handleViewEvent(
    subscription: WebhookSubscription,
    event: ViewEvent
  ): Promise<void> {
    const model = await View.scope("withUser").findByPk(event.modelId, {
      paranoid: false,
    });

    await this.sendWebhook({
      event,
      subscription,
      payload: {
        id: event.modelId,
        model: model && presentView(model),
      },
    });
  }

  private async handleStarEvent(
    subscription: WebhookSubscription,
    event: StarEvent
  ): Promise<void> {
    const model = await Star.findByPk(event.modelId, {
      paranoid: false,
    });

    await this.sendWebhook({
      event,
      subscription,
      payload: {
        id: event.modelId,
        model: model && presentStar(model),
      },
    });
  }

  private async handleShareEvent(
    subscription: WebhookSubscription,
    event: ShareEvent
  ): Promise<void> {
    const model = await Share.findByPk(event.modelId, {
      paranoid: false,
    });

    await this.sendWebhook({
      event,
      subscription,
      payload: {
        id: event.modelId,
        model: model && presentShare(model),
      },
    });
  }

  private async handlePinEvent(
    subscription: WebhookSubscription,
    event: PinEvent
  ): Promise<void> {
    const model = await Pin.findByPk(event.modelId, {
      paranoid: false,
    });

    await this.sendWebhook({
      event,
      subscription,
      payload: {
        id: event.modelId,
        model: model && presentPin(model),
      },
    });
  }

  private async handleTeamEvent(
    subscription: WebhookSubscription,
    event: TeamEvent
  ): Promise<void> {
    const model = await Team.scope("withDomains").findByPk(event.teamId, {
      paranoid: false,
    });

    await this.sendWebhook({
      event,
      subscription,
      payload: {
        id: event.teamId,
        model: model && presentTeam(model),
      },
    });
  }

  private async handleIntegrationEvent(
    subscription: WebhookSubscription,
    event: IntegrationEvent
  ): Promise<void> {
    const model = await Integration.findByPk(event.modelId, {
      paranoid: false,
    });

    await this.sendWebhook({
      event,
      subscription,
      payload: {
        id: event.modelId,
        model: model && presentIntegration(model),
      },
    });
  }

  private async handleGroupEvent(
    subscription: WebhookSubscription,
    event: GroupEvent
  ): Promise<void> {
    const model = await Group.findByPk(event.modelId, {
      paranoid: false,
    });

    await this.sendWebhook({
      event,
      subscription,
      payload: {
        id: event.modelId,
        model: model && presentGroup(model),
      },
    });
  }

  private async handleGroupUserEvent(
    subscription: WebhookSubscription,
    event: GroupUserEvent
  ): Promise<void> {
    const model = await GroupUser.scope(["withUser", "withGroup"]).findOne({
      where: {
        groupId: event.modelId,
        userId: event.userId,
      },
      paranoid: false,
    });

    await this.sendWebhook({
      event,
      subscription,
      payload: {
        id: `${event.userId}-${event.modelId}`,
        model: model && presentGroupMembership(model),
        group: model && presentGroup(model.group),
        user: model && presentUser(model.user),
      },
    });
  }

  private async handleCollectionEvent(
    subscription: WebhookSubscription,
    event: CollectionEvent
  ): Promise<void> {
    const model = await Collection.findByPk(event.collectionId, {
      paranoid: false,
    });

    await this.sendWebhook({
      event,
      subscription,
      payload: {
        id: event.collectionId,
        model: model && presentCollection(model),
      },
    });
  }

  private async handleCollectionUserEvent(
    subscription: WebhookSubscription,
    event: CollectionUserEvent
  ): Promise<void> {
    const model = await CollectionUser.scope([
      "withUser",
      "withCollection",
    ]).findOne({
      where: {
        collectionId: event.collectionId,
        userId: event.userId,
      },
      paranoid: false,
    });

    await this.sendWebhook({
      event,
      subscription,
      payload: {
        id: `${event.userId}-${event.collectionId}`,
        model: model && presentMembership(model),
        collection: model && presentCollection(model.collection),
        user: model && presentUser(model.user),
      },
    });
  }

  private async handleCollectionGroupEvent(
    subscription: WebhookSubscription,
    event: CollectionGroupEvent
  ): Promise<void> {
    const model = await CollectionGroup.scope([
      "withGroup",
      "withCollection",
    ]).findOne({
      where: {
        collectionId: event.collectionId,
        groupId: event.modelId,
      },
      paranoid: false,
    });

    await this.sendWebhook({
      event,
      subscription,
      payload: {
        id: `${event.modelId}-${event.collectionId}`,
        model: model && presentCollectionGroupMembership(model),
        collection: model && presentCollection(model.collection),
        group: model && presentGroup(model.group),
      },
    });
  }

  private async handleFileOperationEvent(
    subscription: WebhookSubscription,
    event: FileOperationEvent
  ): Promise<void> {
    const model = await FileOperation.findByPk(event.modelId, {
      paranoid: false,
    });

    await this.sendWebhook({
      event,
      subscription,
      payload: {
        id: event.modelId,
        model: model && presentFileOperation(model),
      },
    });
  }

  private async handleDocumentEvent(
    subscription: WebhookSubscription,
    event: DocumentEvent
  ): Promise<void> {
    const model = await Document.findByPk(event.documentId, {
      paranoid: false,
    });

    await this.sendWebhook({
      event,
      subscription,
      payload: {
        id: event.documentId,
        model: model && (await presentDocument(model)),
      },
    });
  }

  private async handleRevisionEvent(
    subscription: WebhookSubscription,
    event: RevisionEvent
  ): Promise<void> {
    const model = await Revision.findByPk(event.modelId, {
      paranoid: false,
    });

    await this.sendWebhook({
      event,
      subscription,
      payload: {
        id: event.modelId,
        model: model && (await presentRevision(model)),
      },
    });
  }

  private async handleUserEvent(
    subscription: WebhookSubscription,
    event: UserEvent
  ): Promise<void> {
    const model = await User.findByPk(event.userId, {
      paranoid: false,
    });

    await this.sendWebhook({
      event,
      subscription,
      payload: {
        id: event.userId,
        model: model && presentUser(model),
      },
    });
  }

  private async sendWebhook({
    event,
    subscription,
    payload,
  }: {
    event: Event;
    subscription: WebhookSubscription;
    payload: WebhookPayload;
  }) {
    const delivery = await WebhookDelivery.create({
      webhookSubscriptionId: subscription.id,
      status: "pending",
    });

    let response, requestBody, requestHeaders, status;
    try {
      requestBody = presentWebhook({
        event,
        delivery,
        payload,
      });
      requestHeaders = {
        "Content-Type": "application/json",
        "user-agent": `Outline-Webhooks${
          env.VERSION ? `/${env.VERSION.slice(0, 7)}` : ""
        }`,
      };
      response = await fetch(subscription.url, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
      });
      status = response.ok ? "success" : "failed";
    } catch (err) {
      Logger.error("Failed to send webhook", err, {
        event,
        deliveryId: delivery.id,
      });
      status = "failed";
    }

    await delivery.update({
      status,
      statusCode: response ? response.status : null,
      requestBody,
      requestHeaders,
      responseBody: response ? await response.text() : "",
      responseHeaders: response
        ? Object.fromEntries(response.headers.entries())
        : {},
    });

    if (response && !response.ok) {
      const recentDeliveries = await WebhookDelivery.findAll({
        where: {
          webhookSubscriptionId: subscription.id,
        },
        order: [["createdAt", "DESC"]],
        limit: 25,
      });

      const allFailed = recentDeliveries.every(
        (delivery) => delivery.status === "failed"
      );

      if (recentDeliveries.length === 25 && allFailed) {
        await subscription.update({ enabled: false });
      }
    }
  }
}
